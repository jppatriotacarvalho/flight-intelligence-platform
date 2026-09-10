from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    totals = db.query(
        func.sum(models.AirlinePerformance.total_flights).label("total_flights"),
        func.avg(models.AirlinePerformance.delay_rate).label("avg_delay_rate"),
        func.avg(models.AirlinePerformance.average_arrival_delay).label("avg_arrival_delay"),
        func.avg(models.AirlinePerformance.cancellation_rate).label("avg_cancellation_rate"),
    ).first()

    most_punctual = (
        db.query(models.AirlinePerformance)
        .order_by(models.AirlinePerformance.delay_rate.asc())
        .first()
    )

    most_delayed_airport = (
        db.query(models.AirportPerformance)
        .order_by(models.AirportPerformance.average_departure_delay.desc())
        .first()
    )

    return schemas.DashboardOut(
        total_flights=int(totals.total_flights or 0),
        average_delay_rate=totals.avg_delay_rate,
        average_arrival_delay=totals.avg_arrival_delay,
        average_cancellation_rate=totals.avg_cancellation_rate,
        most_punctual_airline=most_punctual.op_unique_carrier if most_punctual else None,
        most_delayed_airport=most_delayed_airport.airport if most_delayed_airport else None,
    )
