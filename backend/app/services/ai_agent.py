import os
import re
import json
import time
import logging
from decimal import Decimal
from google import genai
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger(__name__)

# ============================================================
# ETAPA 20 — Configuração do cliente Gemini
# ============================================================

# O cliente e' criado na primeira chamada, nao no import. Instanciar aqui
# fazia a API INTEIRA quebrar no boot quando GEMINI_API_KEY faltava — o
# dashboard e os endpoints de dados nao dependem do Gemini e nao tem por
# que cair junto com ele.
_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY nao configurada: o agente de IA esta indisponivel."
            )
        _client = genai.Client(api_key=api_key)
    return _client

# Modelos confirmados como disponíveis para esta chave.
# "gemini-2.5-flash" foi removido da cadeia: a API devolve 404 permanente
# ("no longer available to new users"), então ele nunca funcionou como
# fallback real — só consumia a última posição da lista.
MODEL_FALLBACK_CHAIN = [
    os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
]

# 503 "high demand" costuma passar em segundos: vale retentar no mesmo modelo.
TRANSIENT_MARKERS = ("503", "UNAVAILABLE")

# 429 do free tier e cota DIARIA (limit: 20 req/dia/modelo). O proprio erro
# sugere esperar 12-60s, entao insistir no mesmo modelo so gasta tempo —
# o certo e pular imediatamente para o proximo modelo da cadeia.
QUOTA_MARKERS = ("429", "RESOURCE_EXHAUSTED")

MAX_TENTATIVAS = 2
BACKOFF_INICIAL = 1.0

# Teto de tempo para a cadeia inteira. Sem isso, num dia de cota estourada
# a requisicao percorre todos os modelos e passa de 2 minutos — o frontend
# desiste antes e mostra "Failed to fetch". Melhor falhar rapido e claro.
TEMPO_MAXIMO_TOTAL = 45.0

# Teto por chamada. O teto total sozinho nao basta: ele so e conferido entre
# uma tentativa e outra, entao uma chamada que trava seguraria a requisicao
# indefinidamente. Cada chamada recebe como timeout o menor valor entre este
# teto e o que ainda resta do orcamento total.
#
# 25s medidos na marra: os erros (429/503) voltam rapido, em 0,4-2,6s, mas uma
# resposta VALIDA ja levou 24,0s (gemini-3.5-flash). Um teto mais curto matava
# a resposta certa e o log registrava como "timeout", escondendo a causa.
TEMPO_MAXIMO_POR_CHAMADA = 25.0

# Cota diaria queimada (429) vale para o resto do dia, nao so para a requisicao
# atual. Sem memoria entre requisicoes, toda pergunta seguinte gasta a cadeia de
# novo nos mesmos modelos mortos antes de chegar num que responde. Guardamos o
# horario ate quando ignorar cada modelo; e memoria de processo, some no restart,
# o que e proposital — se a cota virar, o proximo deploy ja esquece.
COOLDOWN_COTA = 900.0  # 15 min
_cota_esgotada_ate: dict[str, float] = {}


def _e_cota(erro: Exception) -> bool:
    """429 do free tier: a cota e diaria, o modelo esta fora pelo resto do dia."""
    texto = str(erro).upper()
    return any(marca in texto for marca in QUOTA_MARKERS)


def _e_transitorio(erro: Exception) -> bool:
    """Erro que tende a sumir em 1-2s — vale nova tentativa no mesmo modelo."""
    texto = str(erro)
    if _e_cota(erro):
        return False
    return any(marca in texto.upper() for marca in TRANSIENT_MARKERS)


def _config_com_timeout(config, segundos: float):
    """Copia o config acrescentando o timeout HTTP (a API espera milissegundos)."""
    completo = dict(config or {})
    http_options = dict(completo.get("http_options") or {})
    http_options["timeout"] = int(max(segundos, 1.0) * 1000)
    completo["http_options"] = http_options
    return completo


def _call_gemini_with_fallback(contents, config):
    """
    Percorre MODEL_FALLBACK_CHAIN e, em cada modelo, tenta até
    MAX_TENTATIVAS vezes com backoff exponencial enquanto o erro for
    transitório (503 "high demand"). Erro permanente ou 429 de cota
    descarta o modelo na hora e vai para o próximo. Só propaga se todos
    falharem.

    O orçamento de TEMPO_MAXIMO_TOTAL é conferido antes de cada tentativa
    e também vira o timeout da própria chamada HTTP, para que nenhuma
    requisição sozinha estoure o teto.
    """
    todos = list(dict.fromkeys(m for m in MODEL_FALLBACK_CHAIN if m))
    agora = time.monotonic()

    # Modelos com 429 recente vao para o fim da fila em vez de serem removidos:
    # se todos estiverem em cooldown ainda vale a pena tentar, pode ter virado
    # o dia ou a cota ter sido liberada.
    disponiveis = [m for m in todos if _cota_esgotada_ate.get(m, 0.0) <= agora]
    adiados = [m for m in todos if m not in disponiveis]
    if adiados:
        logger.info("Modelos com cota esgotada recente, tentados por ultimo: %s", adiados)
    modelos = disponiveis + adiados

    ultimo_erro = None
    prazo = agora + TEMPO_MAXIMO_TOTAL

    for modelo in modelos:
        if time.monotonic() >= prazo:
            logger.warning(
                "Tempo maximo (%.0fs) atingido; modelos nao testados: %s",
                TEMPO_MAXIMO_TOTAL, modelos[modelos.index(modelo):],
            )
            break

        espera = BACKOFF_INICIAL
        for tentativa in range(1, MAX_TENTATIVAS + 1):
            restante = prazo - time.monotonic()
            if restante <= 0:
                logger.warning(
                    "Tempo maximo (%.0fs) atingido durante %s.",
                    TEMPO_MAXIMO_TOTAL, modelo,
                )
                break

            try:
                return _get_client().models.generate_content(
                    model=modelo,
                    contents=contents,
                    config=_config_com_timeout(
                        config, min(restante, TEMPO_MAXIMO_POR_CHAMADA)
                    ),
                )
            except Exception as erro:
                ultimo_erro = erro

                if _e_cota(erro):
                    _cota_esgotada_ate[modelo] = time.monotonic() + COOLDOWN_COTA

                if not _e_transitorio(erro):
                    logger.warning(
                        "Modelo %s descartado sem retentar (cota diaria, timeout "
                        "ou erro permanente), indo para o proximo: %s",
                        modelo, str(erro)[:200],
                    )
                    break

                if tentativa == MAX_TENTATIVAS:
                    logger.warning(
                        "Modelo %s falhou apos %d tentativas: %s", modelo, MAX_TENTATIVAS, erro
                    )
                    break

                if time.monotonic() + espera >= prazo:
                    logger.warning("Sem tempo para retentar %s; proximo modelo.", modelo)
                    break

                logger.info(
                    "Modelo %s: erro transitorio na tentativa %d, aguardando %.1fs",
                    modelo, tentativa, espera,
                )
                time.sleep(espera)
                espera *= 2

    if ultimo_erro:
        raise ultimo_erro
    raise RuntimeError("Nenhum modelo configurado na cadeia de fallback.")

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
        "airport", "airport_name", "airport_city", "airport_state", "airport_label",
        "total_flights", "delayed_flights",
        "average_departure_delay", "cancelled_flights",
        "delay_rate", "cancellation_rate",
    ],
    "route_performance": [
        "origin", "origin_name", "dest", "dest_name", "total_flights",
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
    # Escrita e DDL
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "GRANT", "REVOKE", "REPLACE", "MERGE", "CALL", "EXEC",
    # Escrita/leitura de ARQUIVO a partir de um SELECT. Sem isto,
    # "SELECT origin INTO OUTFILE '/tmp/x' FROM route_performance" passava
    # nas tres validacoes: comeca com SELECT, tabela na whitelist, nenhuma
    # keyword proibida.
    "INTO", "OUTFILE", "DUMPFILE", "LOAD_FILE", "LOAD",
    # Negacao de servico por tempo de execucao
    "SLEEP", "BENCHMARK", "GET_LOCK",
    # Comandos de sessao e statements preparados
    "SET", "USE", "SHOW", "DESCRIBE", "EXPLAIN", "HANDLER",
    "PREPARE", "EXECUTE", "DEALLOCATE",
]

# Comentario dentro da consulta: nao ha motivo legitimo para o modelo gerar um,
# e e' o jeito classico de esconder o resto de um payload.
COMMENT_MARKERS = ("--", "#", "/*")

MAX_ROW_LIMIT = 100


def _build_schema_context() -> str:
    """Monta a descrição do schema permitido para enviar ao Gemini."""
    linhas = []
    for tabela, colunas in ALLOWED_TABLES.items():
        linhas.append(f"- {tabela}({', '.join(colunas)})")
    return "\n".join(linhas)


def _extrair_json(texto: str) -> dict:
    """
    O modelo as vezes embrulha o JSON em cercas ```json ... ```.
    Remove a cerca e faz o parse do primeiro objeto encontrado.
    """
    limpo = texto.strip()
    limpo = re.sub(r"^```(?:json)?\s*", "", limpo)
    limpo = re.sub(r"\s*```$", "", limpo)

    try:
        return json.loads(limpo)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", limpo, re.DOTALL)
        if not match:
            raise ValueError(f"Resposta do modelo nao e JSON valido: {texto[:200]}")
        return json.loads(match.group(0))


def generate_plan(question: str) -> tuple[str, str]:
    """
    ETAPA 20.3 — UMA unica chamada ao Gemini devolve o SQL e o molde da
    resposta em portugues.

    Antes eram duas chamadas por pergunta (SQL, depois texto), o que
    consumia o dobro da cota diaria do free tier. Aqui o modelo devolve
    tambem uma frase com marcadores {coluna}; os numeros reais sao
    preenchidos em Python a partir do resultado do banco. Isso corta a
    cota pela metade e ainda elimina o risco de o modelo inventar
    numeros, porque ele nunca chega a ver os dados.

    Retorna (sql, molde_da_resposta) ou (FORA_DE_CONTEXTO_TOKEN, "").
    """
    schema_context = _build_schema_context()

    system_instruction = f"""
Você converte perguntas em português sobre dados de voos em consultas SQL
para MySQL.

Responda SEMPRE com um único objeto JSON, sem markdown e sem cercas de
código, exatamente neste formato:
{{"sql": "<a consulta>", "resposta": "<frase com marcadores>"}}

Regras para o campo "sql":
1. Use APENAS estas tabelas e colunas (nunca invente nomes):
{schema_context}
2. Gere SOMENTE SELECT. Nunca INSERT, UPDATE, DELETE, DROP, ALTER ou CREATE.
3. Nunca use "SELECT *" — liste as colunas explicitamente.
4. Sem ponto e vírgula no final.
4.1. Aeroportos: a chave é a sigla IATA (airport, origin, dest). Quando a
   pergunta citar uma CIDADE ou o nome do aeroporto ("Atlanta", "Chicago"),
   filtre por airport_name ou airport_city com LIKE, nunca por igualdade
   com a sigla. Ex.: WHERE airport_city LIKE '%Atlanta%'.
4.2. Sempre que a resposta citar um aeroporto, inclua airport_label
   (ou airport_name) no SELECT, para a frase sair com o nome e não só a sigla.

Regras para o campo "resposta":
5. Escreva uma frase natural em português que responda à pergunta, usando
   {{nome_da_coluna}} como marcador onde entraria cada valor.
   Exemplo: "A companhia com a maior taxa de atraso é a
   {{op_unique_carrier}}, com uma taxa de {{delay_rate}}."
   Para aeroportos, prefira o marcador {{airport_label}} ao {{airport}}.
6. Use marcadores APENAS de colunas que aparecem no SELECT.
7. NÃO escreva números você mesmo e NÃO use markdown (nada de ** ou #).
   Os valores reais serão inseridos depois, já formatados.

8. Se a pergunta não tiver relação com voos, aeroportos, companhias aéreas,
   rotas ou atrasos, responda exatamente com:
   {{"sql": "{FORA_DE_CONTEXTO_TOKEN}", "resposta": ""}}
""".strip()

    response = _call_gemini_with_fallback(
        contents=question,
        config={"system_instruction": system_instruction, "temperature": 0},
    )

    plano = _extrair_json(response.text or "")
    sql = (plano.get("sql") or "").strip()
    molde = (plano.get("resposta") or "").strip()

    if not sql:
        raise ValueError("O modelo nao devolveu nenhuma consulta SQL.")

    return sql, molde


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

    for marcador in COMMENT_MARKERS:
        if marcador in sql_limpo:
            raise ValueError("Comentarios nao sao permitidos na consulta.")

    # Variaveis de sessao/sistema (@@version, @x) nao tem uso legitimo aqui.
    if "@" in sql_limpo:
        raise ValueError("Uso de variaveis nao e permitido na consulta.")

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


def _formatar_valor(coluna: str, valor) -> str:
    """
    Formata um valor vindo do MySQL no padrao brasileiro.

    Colunas *_rate chegam como fracao (0.2734) e viram "27,34%".
    Inteiros ganham separador de milhar ("341.910") e decimais usam
    virgula. Isso e feito em Python de proposito: o modelo nunca ve os
    numeros, entao nao tem como arredondar errado nem inventar.
    """
    if valor is None:
        return "nao informado"

    if isinstance(valor, bool):
        return "sim" if valor else "nao"

    if isinstance(valor, (int, float, Decimal)):
        numero = float(valor)

        if "rate" in coluna.lower():
            return f"{numero * 100:.2f}".replace(".", ",") + "%"

        if numero.is_integer():
            return f"{int(numero):,}".replace(",", ".")

        return f"{numero:.2f}".replace(".", ",")

    return str(valor)


def _linha_legivel(linha: dict) -> str:
    return ", ".join(f"{col}: {_formatar_valor(col, val)}" for col, val in linha.items())


def format_answer(rows: list[dict], molde: str) -> str:
    """
    ETAPA 20.6 — Monta a resposta final SEM chamar o Gemini de novo.

    Preenche os marcadores {coluna} do molde com os valores da primeira
    linha. Se o molde vier vazio ou citar colunas que nao existem no
    resultado, cai num resumo generico em vez de quebrar.
    """
    if not rows:
        return "Nao foram encontrados dados para essa pergunta."

    primeira = rows[0]
    campos = re.findall(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}", molde or "")
    ausentes = [c for c in campos if c not in primeira]

    if molde and campos and not ausentes:
        resposta = molde
        for coluna in campos:
            resposta = resposta.replace(
                "{" + coluna + "}", _formatar_valor(coluna, primeira[coluna])
            )
    else:
        if molde and ausentes:
            logger.warning(
                "Molde cita colunas ausentes no resultado %s; usando resumo generico.",
                ausentes,
            )
        resposta = f"Resultado encontrado — {_linha_legivel(primeira)}."

    if len(rows) > 1:
        extras = "; ".join(_linha_legivel(linha) for linha in rows[1:6])
        resposta += f" Demais resultados: {extras}."
        if len(rows) > 6:
            resposta += f" (+{len(rows) - 6} linhas)"

    return resposta
