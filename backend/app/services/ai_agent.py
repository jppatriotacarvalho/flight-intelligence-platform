import os
import re
import json
from google import genai
from sqlalchemy import text
from app.database import engine

# ============================================================
# ETAPA 20 — Configuração do cliente Gemini
# ============================================================

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

FORA_DE_CONTEXTO_TOKEN = "FORA_DE_CONTEXTO"

# ============================================================
# ETAPA 21.2 e 21.3 — Whitelist de tabelas e colunas permitidas
# Nunca acessar Bronze, Silver ou tabelas fora desta lista.
# ============================================================

ALLOWED_TABLES: dict[str, list[str]] = {
    "airline_performance": [
        "op_unique_carrier", "total_flights", "delayed_flights",
        "average_departure_delay", "average_arrival_delay",
        "cancelled_flights", "diverted_flights", "delay_rate", "cancellation_rate",
    ],
    "airport_performance": [
        "airport", "total_flights", "delayed_flights",
        "average_departure_delay", "cancelled_flights",
        "delay_rate", "cancellation_rate",
    ],
    "route_performance": [
        "origin", "dest", "total_flights",
        "average_arrival_delay", "average_distance",
    ],
    "delay_causes": [
        "total_carrier_delay", "total_weather_delay", "total_nas_delay",
        "total_security_delay", "total_late_aircraft_delay",
    ],
    "flight_trends": [
        "month", "total_flights", "delayed_flights",
        "average_arrival_delay", "delay_rate",
    ],
}

# ============================================================
# ETAPA 21.1 — Bloquear qualquer comando que não seja leitura
# ============================================================

FORBIDDEN_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "GRANT", "REVOKE", "REPLACE", "MERGE", "CALL", "EXEC",
]

MAX_ROW_LIMIT = 100


def _build_schema_context() -> str:
    """Monta a descrição do schema permitido para enviar ao Gemini."""
    linhas = []
    for tabela, colunas in ALLOWED_TABLES.items():
        linhas.append(f"- {tabela}({', '.join(colunas)})")
    return "\n".join(linhas)


def generate_sql(question: str) -> str:
    """
    ETAPA 20.3 — Envia a pergunta ao Gemini e recebe de volta uma
    consulta SQL (ou o token de fora de contexto).

    IMPORTANTE (Etapa 21.6): nunca enviamos credenciais, connection
    string ou qualquer dado privado ao Gemini — apenas a pergunta do
    usuário e a lista de tabelas/colunas permitidas.
    """
    schema_context = _build_schema_context()

    system_instruction = f"""
Você converte perguntas em português sobre dados de voos em consultas SQL
para MySQL.

Regras obrigatórias:
1. Use APENAS estas tabelas e colunas (nunca invente nomes):
{schema_context}

2. Gere SOMENTE comandos SELECT. Nunca gere INSERT, UPDATE, DELETE, DROP,
   ALTER, CREATE ou qualquer comando de escrita.
3. Nunca use "SELECT *" — sempre liste as colunas explicitamente.
4. Responda APENAS com a consulta SQL pura, sem markdown, sem explicação,
   sem ponto e vírgula no final.
5. Se a pergunta não tiver relação com voos, aeroportos, companhias aéreas,
   rotas ou atrasos, responda exatamente com a palavra: {FORA_DE_CONTEXTO_TOKEN}
   (nada mais, nenhuma outra palavra).
""".strip()

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=question,
        config={"system_instruction": system_instruction, "temperature": 0},
    )

    return (response.text or "").strip()


def validate_sql(sql: str) -> str:
    """
    ETAPA 21 — Pipeline de segurança.
    Levanta ValueError com uma mensagem clara se a consulta não for segura.
    Retorna a consulta validada (com LIMIT garantido).
    """
    sql_limpo = sql.strip().rstrip(";").strip()

    if not sql_limpo:
        raise ValueError("A consulta gerada veio vazia.")

    # 21.1 — apenas SELECT, um único comando (sem ; no meio)
    if ";" in sql_limpo:
        raise ValueError("Múltiplos comandos SQL não são permitidos.")

    if not re.match(r"^\s*SELECT\s", sql_limpo, re.IGNORECASE):
        raise ValueError("Apenas consultas SELECT são permitidas.")

    sql_upper = sql_limpo.upper()
    for palavra in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{palavra}\b", sql_upper):
            raise ValueError(f"Comando não permitido detectado: {palavra}")

    if re.search(r"SELECT\s+\*", sql_upper):
        raise ValueError("Uso de 'SELECT *' não é permitido — liste as colunas.")

    # 21.2 — validar tabelas usadas contra a whitelist
    tabelas_usadas = set(
        t.lower() for t in re.findall(r"(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)", sql_limpo, re.IGNORECASE)
    )
    tabelas_invalidas = tabelas_usadas - set(ALLOWED_TABLES.keys())
    if tabelas_invalidas:
        raise ValueError(f"Tabela(s) não permitida(s): {', '.join(tabelas_invalidas)}")
    if not tabelas_usadas:
        raise ValueError("Não foi possível identificar a tabela da consulta.")

    # 21.4 — garantir LIMIT
    if not re.search(r"\bLIMIT\s+\d+", sql_upper):
        sql_limpo = f"{sql_limpo} LIMIT {MAX_ROW_LIMIT}"
    else:
        # Garante que o LIMIT não ultrapasse o máximo permitido
        def _cap_limit(match: re.Match) -> str:
            valor = min(int(match.group(1)), MAX_ROW_LIMIT)
            return f"LIMIT {valor}"

        sql_limpo = re.sub(r"LIMIT\s+(\d+)", _cap_limit, sql_limpo, flags=re.IGNORECASE)

    return sql_limpo


def run_query(sql: str) -> list[dict]:
    """Executa a consulta já validada, em modo somente leitura."""
    with engine.connect() as conn:
        resultado = conn.execute(text(sql))
        colunas = resultado.keys()
        linhas = [dict(zip(colunas, linha)) for linha in resultado.fetchall()]
    return linhas


def generate_natural_language_answer(question: str, sql: str, rows: list[dict]) -> str:
    """
    ETAPA 20.6 — Traduz o resultado estruturado de volta para
    linguagem natural, em português.
    """
    dados_json = json.dumps(rows, default=str, ensure_ascii=False)

    prompt = f"""
Pergunta original do usuário: {question}

Consulta SQL executada: {sql}

Resultado (JSON): {dados_json}

Responda a pergunta do usuário em português, de forma natural e direta,
usando apenas os números presentes no resultado acima. Não invente dados
que não estejam no resultado. Se o resultado estiver vazio, diga que não
foram encontrados dados para essa pergunta.
""".strip()

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config={"temperature": 0.3},
    )

    return (response.text or "").strip()
