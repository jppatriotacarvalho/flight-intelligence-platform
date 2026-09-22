"""
Validador de SQL do agente de IA.

Os casos sao exatamente as duas tabelas da secao 3 de
`docs/ai_agent_security.md` ("Payloads de ataque" e "Consultas legitimas").
A doc afirmava que esses testes existiam; agora eles existem de verdade, e
qualquer mudanca no validador que quebre um deles derruba a suite.
"""
import pytest

from app.services.ai_agent import MAX_ROW_LIMIT, validate_sql

# docs/ai_agent_security.md, secao 3 — "Payloads de ataque"
PAYLOADS_BLOQUEADOS = [
    ("INTO OUTFILE", "SELECT origin INTO OUTFILE '/tmp/x' FROM route_performance"),
    ("LOAD_FILE", "SELECT origin, LOAD_FILE('/etc/passwd') FROM route_performance"),
    ("SLEEP", "SELECT origin FROM route_performance WHERE SLEEP(10)"),
    ("comentario", "SELECT origin FROM route_performance -- ignore"),
    ("variavel de sessao", "SELECT @@version FROM route_performance"),
    ("multiplos comandos", "SELECT origin FROM route_performance; DROP TABLE x"),
    ("SELECT *", "SELECT * FROM route_performance"),
    ("tabela fora da whitelist", "SELECT a FROM information_schema.tables"),
    ("nao e SELECT", "DROP TABLE airline_performance"),
    ("tabela Bronze", "SELECT op_unique_carrier FROM bronze_flights_raw"),
]

# docs/ai_agent_security.md, secao 3 — "Consultas legitimas"
# (sql, limite esperado depois da validacao)
CONSULTAS_ACEITAS = [
    (
        "SELECT airport, airport_label, delay_rate FROM airport_performance"
        " ORDER BY delay_rate DESC LIMIT 5",
        5,
    ),
    (
        "SELECT op_unique_carrier, delay_rate FROM airline_performance"
        " ORDER BY delay_rate DESC",
        MAX_ROW_LIMIT,
    ),
    (
        "SELECT origin, dest, total_flights FROM route_performance"
        " WHERE origin = 'ATL' ORDER BY total_flights DESC LIMIT 200",
        MAX_ROW_LIMIT,
    ),
    (
        "SELECT airport, airport_name FROM airport_performance"
        " WHERE airport_city LIKE '%Atlanta%'",
        MAX_ROW_LIMIT,
    ),
    (
        "SELECT month, COUNT(total_flights) FROM flight_trends GROUP BY month",
        MAX_ROW_LIMIT,
    ),
]


@pytest.mark.parametrize("motivo,sql", PAYLOADS_BLOQUEADOS, ids=[c[0] for c in PAYLOADS_BLOQUEADOS])
def test_payload_de_ataque_e_bloqueado(motivo: str, sql: str):
    with pytest.raises(ValueError):
        validate_sql(sql)


@pytest.mark.parametrize("sql,limite", CONSULTAS_ACEITAS)
def test_consulta_legitima_passa_com_o_limit_certo(sql: str, limite: int):
    validado = validate_sql(sql)
    assert f"LIMIT {limite}" in validado.upper()


def test_consulta_vazia_e_recusada():
    with pytest.raises(ValueError):
        validate_sql("   ")


def test_limit_acima_do_teto_e_reduzido():
    validado = validate_sql(
        "SELECT airport FROM airport_performance LIMIT 5000"
    )
    assert validado.upper().endswith(f"LIMIT {MAX_ROW_LIMIT}")


def test_ponto_e_virgula_final_nao_invalida_a_consulta():
    # O modelo as vezes fecha com ";" — isso nao e' "multiplos comandos".
    validado = validate_sql("SELECT airport FROM airport_performance LIMIT 5;")
    assert ";" not in validado
