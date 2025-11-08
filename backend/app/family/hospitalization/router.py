from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Hospitalization, FamilyMember
from app.schemas import HospitalizationOut, HospitalizationCreate, HospitalizationUpdate

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Hospitalizations"]
)

# Obtener todas las hospitalizaciones del miembro
@router.get("/hospitalizations", response_model=list[HospitalizationOut])
async def get_member_hospitalizations(
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hospitalization).where(Hospitalization.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()


# Crear una nueva hospitalización
@router.post("/hospitalizations", response_model=HospitalizationOut, status_code=status.HTTP_201_CREATED)
async def create_hospitalization(
    data: HospitalizationCreate,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    new_hosp = Hospitalization(
        family_id=member.family_id,
        member_id=member.id,
        reason=data.reason,
        admission_date=data.admission_date,
        discharge_date=data.discharge_date,
        facility_name=data.facility_name,
        notes=data.notes,
    )
    db.add(new_hosp)
    await db.commit()
    await db.refresh(new_hosp)
    return new_hosp


# Actualizar hospitalización existente
@router.put("/hospitalizations/{hosp_id}", response_model=HospitalizationOut)
async def update_hospitalization(
    hosp_id: int,
    data: HospitalizationUpdate,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hospitalization).where(
        Hospitalization.id == hosp_id,
        Hospitalization.member_id == member.id
    )
    result = await db.execute(stmt)
    hosp = result.scalars().first()

    if not hosp:
        raise HTTPException(status_code=404, detail="Hospitalizacion no encontrada")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(hosp, key, value)

    await db.commit()
    await db.refresh(hosp)
    return hosp


# Eliminar hospitalización
@router.delete("/hospitalizations/{hosp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospitalization(
    hosp_id: int,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hospitalization).where(
        Hospitalization.id == hosp_id,
        Hospitalization.member_id == member.id
    )
    result = await db.execute(stmt)
    hosp = result.scalars().first()

    if not hosp:
        raise HTTPException(status_code=404, detail="Hospitalizacion no encontrada")

    await db.delete(hosp)
    await db.commit()
