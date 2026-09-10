from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/airlines", tags=["Airlines"])


@router.get("", response_model=list[schemas.AirlinePerformanceOut])
def list_airlines(db: Session = Depends(get_db)):
    return db.query(models.AirlinePerformance).all()


@router.get("/{airline_id}", response_model=schemas.AirlinePerformanceOut)
def get_airline(airline_id: str, db: Session = Depends(get_db)):
    airline = (
        db.query(models.AirlinePerformance)
        .filter(models.AirlinePerformance.op_unique_carrier == airline_id.upper())
        .first()
    )
    if not airline:
        raise HTTPException(status_code=404, detail="Companhia nao encontrada")
    return airline
