from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/airports", tags=["Airports"])


@router.get("", response_model=list[schemas.AirportPerformanceOut])
def list_airports(db: Session = Depends(get_db)):
    return db.query(models.AirportPerformance).all()


@router.get("/{airport_code}", response_model=schemas.AirportPerformanceOut)
def get_airport(airport_code: str, db: Session = Depends(get_db)):
    airport = (
        db.query(models.AirportPerformance)
        .filter(models.AirportPerformance.airport == airport_code.upper())
        .first()
    )
    if not airport:
        raise HTTPException(status_code=404, detail="Aeroporto nao encontrado")
    return airport
