from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family
from app.models import FamilyHistoryCondition, Family
from app.schemas import (
    FamilyHistoryConditionCreate,
    FamilyHistoryConditionUpdate,
    FamilyHistoryConditionOut
)

router = APIRouter(
    prefix="/families/{family_id}/history",
    tags=["Family History"]
)

# Obtener todos los antecedentes familiares
@router.get("", response_model=list[FamilyHistoryConditionOut])
async def get_all_family_history(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(FamilyHistoryCondition)
        .where(FamilyHistoryCondition.family_id == current_family.id)
        .order_by(FamilyHistoryCondition.condition_name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# Crear un nuevo antecedente familiar
@router.post("", response_model=FamilyHistoryConditionOut, status_code=status.HTTP_201_CREATED)
async def create_family_history_condition(
    condition_data: FamilyHistoryConditionCreate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    new_condition = FamilyHistoryCondition(
        **condition_data.dict(),
        family_id=current_family.id
    )
    db.add(new_condition)
    await db.commit()
    await db.refresh(new_condition)
    return new_condition


# Actualizar un antecedente familiar existente
@router.put("/{condition_id}", response_model=FamilyHistoryConditionOut)
async def update_family_history_condition(
    condition_id: int,
    condition_data: FamilyHistoryConditionUpdate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    condition = await db.get(FamilyHistoryCondition, condition_id)

    if not condition or condition.family_id != current_family.id:
        raise HTTPException(status_code=404, detail="Antecedente no encontrado")

    for key, value in condition_data.dict(exclude_unset=True).items():
        setattr(condition, key, value)

    await db.commit()
    await db.refresh(condition)
    return condition


# Eliminar un antecedente familiar
@router.delete("/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_history_condition(
    condition_id: int,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    condition = await db.get(FamilyHistoryCondition, condition_id)

    if not condition or condition.family_id != current_family.id:
        raise HTTPException(status_code=404, detail="Antecedente no encontrada")

    await db.delete(condition)
    await db.commit()
    return None
