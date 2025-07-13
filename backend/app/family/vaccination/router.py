from fastapi import APIRouter, Depends, status, Query, HTTPException
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.family.dependencies import get_current_active_family
from app.schemas import VaccinationOut
from app.models import Vaccination, Family

router = APIRouter(
    prefix="/families/{family_id}/vaccinations",
    tags=["Vaccinations"]
)

@router.get("", response_model=list[VaccinationOut])
async def get_all_vaccinations_for_family(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Vaccination).where(
        Vaccination.family_id == current_family.id
    )
    vaccinations = (await db.scalars(stmt)).all()
    return vaccinations

