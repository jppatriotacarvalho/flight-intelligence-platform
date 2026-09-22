"""
KPIs do dashboard, com SQLite em memoria no lugar do MySQL.

Da' para trocar o banco porque os models nao usam nada especifico de MySQL:
sao Column(String/Integer/Float/BigInteger) e chaves primarias simples, sem
tipo proprietario, sem ENUM e sem funcao de dialeto. O primeiro teste fixa
isso — se alguem acrescentar um tipo so' de MySQL, ele quebra aqui antes de
quebrar a suite inteira.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base, get_db
from app.main import app
from app.routers.dashboard import POOL_AEROPORTOS_MOVIMENTADOS


def companhia(codigo, total, atrasados, cancelados, desviados, arr_delay, delay_rate):
    return models.AirlinePerformance(
        op_unique_carrier=codigo,
        total_flights=total,
        delayed_flights=atrasados,
        average_departure_delay=10.0,
        average_arrival_delay=arr_delay,
        cancelled_flights=cancelados,
        diverted_flights=desviados,
        delay_rate=delay_rate,
        cancellation_rate=cancelados / total,
    )


def aeroporto(sigla, total, dep_delay, cancel_rate=0.01):
    return models.AirportPerformance(
        airport=sigla,
        total_flights=total,
        delayed_flights=int(total * 0.2),
        average_departure_delay=dep_delay,
        cancelled_flights=int(total * cancel_rate),
        delay_rate=0.2,
        cancellation_rate=cancel_rate,
    )


@pytest.fixture
def client():
    # StaticPool: sem ele cada conexao abriria um banco em memoria novo, e a
    # thread do TestClient nao enxergaria as linhas inseridas aqui.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    sessao = sessionmaker(bind=engine)()

    sessao.add_all(
        [
            # Companhia grande e pontual x companhia pequena e ruim: e' o que
            # separa a media ponderada da media simples.
            companhia("WN", 1_000_000, 100_000, 10_000, 0, 5.0, 0.10),
            companhia("HA", 10_000, 5_000, 0, 0, 100.0, 0.50),
        ]
    )
    # 20 aeroportos movimentados, com atraso modesto...
    for i in range(POOL_AEROPORTOS_MOVIMENTADOS):
        sessao.add(aeroporto(f"A{i:02d}", 100_000 - i, 10.0 + i * 0.1))
    # ...e um minusculo com atraso enorme, fora do pool (como o MGW real:
    # 37 voos e 72,6 min de atraso medio de partida).
    sessao.add(aeroporto("MGW", 37, 72.6))
    sessao.commit()

    app.dependency_overrides[get_db] = lambda: sessao
    yield TestClient(app)
    app.dependency_overrides.clear()
    sessao.close()


def test_models_rodam_em_sqlite_sem_tipo_especifico_de_mysql():
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)  # levanta se houver tipo so' de MySQL
    assert set(Base.metadata.tables) == {
        "airline_performance",
        "airport_performance",
        "route_performance",
        "delay_causes",
        "flight_trends",
    }


def test_total_de_voos_e_a_soma_das_companhias(client):
    assert client.get("/dashboard").json()["total_flights"] == 1_010_000


def test_taxa_de_atraso_e_soma_sobre_soma_e_nao_media_simples(client):
    dados = client.get("/dashboard").json()

    # Soma / Soma = 105.000 / 1.010.000
    assert dados["delay_rate"] == pytest.approx(105_000 / 1_010_000)
    # A media simples das duas taxas daria 30% — quase o triplo.
    assert dados["delay_rate"] != pytest.approx((0.10 + 0.50) / 2)


def test_taxa_de_cancelamento_e_soma_sobre_soma(client):
    dados = client.get("/dashboard").json()
    assert dados["cancellation_rate"] == pytest.approx(10_000 / 1_010_000)


def test_atraso_medio_de_chegada_e_ponderado_por_voos_concluidos(client):
    dados = client.get("/dashboard").json()

    # Cancelados e desviados nao tem arr_delay, entao ficam fora do peso:
    # (5 * 990.000 + 100 * 10.000) / 1.000.000
    esperado = (5.0 * 990_000 + 100.0 * 10_000) / 1_000_000
    assert dados["average_arrival_delay"] == pytest.approx(esperado)
    # A media simples daria 52,5 min.
    assert dados["average_arrival_delay"] != pytest.approx((5.0 + 100.0) / 2)


def test_aeroporto_minusculo_nao_vence_o_kpi_de_mais_atrasado(client):
    dados = client.get("/dashboard").json()

    # MGW tem o maior atraso do banco, mas so' 37 voos: fora do top 20.
    assert dados["most_delayed_airport"] != "MGW"
    # Vence o mais atrasado DENTRO do pool: A19, com 10 + 1,9.
    assert dados["most_delayed_airport"] == "A19"
    assert dados["most_delayed_airport_delay"] == pytest.approx(11.9)


def test_companhia_mais_pontual_vem_com_nome_e_taxa(client):
    dados = client.get("/dashboard").json()

    assert dados["most_punctual_airline"] == "WN"
    assert dados["most_punctual_airline_name"] == "Southwest Airlines"
    assert dados["most_punctual_airline_delay_rate"] == pytest.approx(0.10)


def test_listagem_de_companhias_traz_o_nome_da_decisao_04(client):
    por_codigo = {a["op_unique_carrier"]: a for a in client.get("/airlines").json()}

    assert por_codigo["WN"]["airline_name"] == "Southwest Airlines"
    assert por_codigo["WN"]["airline_short_name"] == "Southwest"
    assert por_codigo["HA"]["airline_name"] == "Hawaiian Airlines"
