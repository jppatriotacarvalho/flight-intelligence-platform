from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/delays", tags=["Delays"])


@router.get("", response_model=schemas.DelayCausesOut)
def get_delay_causes(db: Session = Depends(get_db)):
    delay_causes = db.query(models.DelayCauses).first()
    if not delay_causes:
        raise HTTPException(status_code=404, detail="Dados de atraso nao encontrados")
    return delay_causes
