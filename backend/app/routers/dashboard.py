from fastapi import APIRouter, Depends
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.carriers import carrier_name
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Mesmo recorte do grafico "Atraso medio de partida" do dashboard
# (POOL_AEROPORTOS_MOVIMENTADOS em frontend/src/lib/chart.ts). Sem piso de
# volume o KPI apontava MGW, que teve 37 voos no ano inteiro, enquanto o
# grafico logo abaixo mostrava DFW — card e grafico se contradiziam.
POOL_AEROPORTOS_MOVIMENTADOS = 20


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    # Voos em que arr_delay existe: cancelados e desviados nao tem horario de
    # chegada (Regras 02 e 05 da Silver), entao sao o peso certo para ponderar
    # o atraso medio de chegada.
    concluidos = (
        models.AirlinePerformance.total_flights
        - models.AirlinePerformance.cancelled_flights
        - models.AirlinePerformance.diverted_flights
    )
    # Companhia sem atraso medio nao pode entrar so' no denominador, senao a
    # media ponderada sai menor do que e'.
    peso_arrival = case(
        (models.AirlinePerformance.average_arrival_delay.is_(None), 0),
        else_=concluidos,
    )

    # As taxas sao Soma / Soma, nunca AVG das 15 linhas: a media simples trata
    # a Hawaiian (78 mil voos) com o mesmo peso da Southwest (1,4 milhao).
    # E' o que os KPIs 02 e 05 de docs/business_rules.md definem.
    totals = db.query(
        func.sum(models.AirlinePerformance.total_flights).label("total_flights"),
        func.sum(models.AirlinePerformance.delayed_flights).label("delayed_flights"),
        func.sum(models.AirlinePerformance.cancelled_flights).label("cancelled_flights"),
        func.sum(models.AirlinePerformance.average_arrival_delay * peso_arrival).label(
            "arrival_delay_ponderado"
        ),
        func.sum(peso_arrival).label("voos_concluidos"),
    ).first()

    total_flights = int(totals.total_flights or 0)
    voos_concluidos = float(totals.voos_concluidos or 0)

    delay_rate = (
        float(totals.delayed_flights) / total_flights if total_flights else None
    )
    cancellation_rate = (
        float(totals.cancelled_flights) / total_flights if total_flights else None
    )
    average_arrival_delay = (
        float(totals.arrival_delay_ponderado) / voos_concluidos
        if voos_concluidos
        else None
    )

    most_punctual = (
        db.query(models.AirlinePerformance)
        .order_by(models.AirlinePerformance.delay_rate.asc())
        .first()
    )

    # O KPI precisa do mesmo piso de volume do grafico: primeiro os 20
    # aeroportos com mais voos, depois o maior atraso medio entre eles.
    mais_movimentados = (
        db.query(
            models.AirportPerformance.airport,
            models.AirportPerformance.airport_name,
            models.AirportPerformance.average_departure_delay,
        )
        .order_by(models.AirportPerformance.total_flights.desc())
        .limit(POOL_AEROPORTOS_MOVIMENTADOS)
        .subquery()
    )
    most_delayed_airport = (
        db.query(mais_movimentados)
        .order_by(mais_movimentados.c.average_departure_delay.desc())
        .first()
    )

    return schemas.DashboardOut(
        total_flights=total_flights,
        delay_rate=delay_rate,
        average_arrival_delay=average_arrival_delay,
        cancellation_rate=cancellation_rate,
        most_punctual_airline=most_punctual.op_unique_carrier if most_punctual else None,
        most_punctual_airline_name=(
            carrier_name(most_punctual.op_unique_carrier) if most_punctual else None
        ),
        most_punctual_airline_delay_rate=most_punctual.delay_rate if most_punctual else None,
        most_delayed_airport=most_delayed_airport.airport if most_delayed_airport else None,
        # Nome em campo separado: no KPI a sigla fica grande e o nome embaixo,
        # em vez de um rotulo longo quebrando o card.
        most_delayed_airport_name=(
            most_delayed_airport.airport_name if most_delayed_airport else None
        ),
        most_delayed_airport_delay=(
            most_delayed_airport.average_departure_delay if most_delayed_airport else None
        ),
    )
