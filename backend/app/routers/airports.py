from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/airports", tags=["Airports"])


@router.get("", response_model=list[schemas.AirportPerformanceOut])
def list_airports(
    search: str | None = Query(
        None,
        description="Filtra por sigla, nome ou cidade do aeroporto (ex: ATL, Atlanta).",
    ),
    db: Session = Depends(get_db),
):
    consulta = db.query(models.AirportPerformance)

    # A busca aceita os dois mundos: quem sabe a sigla digita "ATL",
    # quem nao sabe digita "Atlanta" e chega no mesmo registro.
    if search and search.strip():
        termo = f"%{search.strip()}%"
        consulta = consulta.filter(
            or_(
                models.AirportPerformance.airport.like(f"{search.strip().upper()}%"),
                models.AirportPerformance.airport_name.like(termo),
                models.AirportPerformance.airport_city.like(termo),
            )
        )

    return consulta.all()


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
