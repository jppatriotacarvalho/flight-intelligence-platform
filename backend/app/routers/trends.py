from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trends", tags=["Trends"])


@router.get("", response_model=list[schemas.FlightTrendsOut])
def list_trends(
    month: int | None = Query(None, ge=1, le=12, description="Filtrar por mes (1-12)"),
    db: Session = Depends(get_db),
):
    query = db.query(models.FlightTrends)

    if month:
        query = query.filter(models.FlightTrends.month == month)

    return query.order_by(models.FlightTrends.month).all()
