from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.get("", response_model=list[schemas.RoutePerformanceOut])
def list_routes(
    origin: str | None = Query(None, description="Filtrar por aeroporto de origem"),
    destination: str | None = Query(None, description="Filtrar por aeroporto de destino"),
    db: Session = Depends(get_db),
):
    query = db.query(models.RoutePerformance)

    if origin:
        query = query.filter(models.RoutePerformance.origin == origin.upper())
    if destination:
        query = query.filter(models.RoutePerformance.dest == destination.upper())

    return query.order_by(models.RoutePerformance.total_flights.desc()).all()
