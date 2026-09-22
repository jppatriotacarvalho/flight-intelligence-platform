"""
Formatacao das respostas do agente.

Os numeros sao preenchidos em Python justamente para o modelo nunca ver os
dados; entao a formatacao precisa de teste proprio — se ela quebrar, a
resposta sai errada sem nenhum erro aparecer no log.
"""
from app.services.ai_agent import format_answer


def test_taxa_vira_percentual_em_pt_br():
    resposta = format_answer(
        [{"op_unique_carrier": "F9", "delay_rate": 0.2734}],
        "A taxa da {op_unique_carrier} e de {delay_rate}.",
    )
    assert "27,34%" in resposta


def test_inteiro_ganha_separador_de_milhar():
    resposta = format_answer(
        [{"airport": "ATL", "total_flights": 341910}],
        "O {airport} teve {total_flights} voos.",
    )
    assert "341.910" in resposta


def test_airport_label_nulo_cai_para_a_sigla():
    # O dump atual tem as colunas descritivas vazias. Sem o fallback, a frase
    # saia "o aeroporto com mais voos e o nao informado".
    resposta = format_answer(
        [{"airport": "ATL", "airport_label": None, "total_flights": 341910}],
        "O aeroporto com mais voos e o {airport_label}, com {total_flights} voos.",
    )
    assert "ATL" in resposta
    assert "nao informado" not in resposta


def test_airport_name_nulo_cai_para_a_sigla():
    resposta = format_answer(
        [{"airport": "ORD", "airport_name": None, "delay_rate": 0.21}],
        "O {airport_name} tem taxa de {delay_rate}.",
    )
    assert "ORD" in resposta
    assert "nao informado" not in resposta


def test_origin_name_e_dest_name_nulos_caem_para_as_siglas():
    resposta = format_answer(
        [
            {
                "origin": "HNL",
                "origin_name": None,
                "dest": "OGG",
                "dest_name": None,
                "total_flights": 11638,
            }
        ],
        "A rota {origin_name} - {dest_name} teve {total_flights} voos.",
    )
    assert "HNL" in resposta
    assert "OGG" in resposta
    assert "nao informado" not in resposta


def test_resumo_generico_tambem_usa_o_fallback():
    # Molde vazio: a resposta cai no resumo linha a linha, que passa pelo
    # mesmo caminho de formatacao.
    resposta = format_answer([{"airport": "ATL", "airport_label": None}], "")
    assert "ATL" in resposta
    assert "nao informado" not in resposta


def test_codigo_da_companhia_vem_com_o_nome():
    resposta = format_answer(
        [{"op_unique_carrier": "YX", "delay_rate": 0.133}],
        "A mais pontual e a {op_unique_carrier}.",
    )
    assert "YX (Republic Airways)" in resposta


def test_coluna_descritiva_preenchida_nao_e_substituida():
    resposta = format_answer(
        [{"airport": "ATL", "airport_label": "ATL - Atlanta, GA"}],
        "O aeroporto e o {airport_label}.",
    )
    assert "ATL - Atlanta, GA" in resposta


def test_resultado_vazio_nao_quebra():
    assert format_answer([], "O {airport} teve {total_flights} voos.")
