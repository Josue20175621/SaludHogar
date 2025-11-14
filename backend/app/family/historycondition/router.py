from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family, get_family_and_dek
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
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek

    stmt = (
        select(FamilyHistoryCondition)
        .where(FamilyHistoryCondition.family_id == family.id)
        .order_by(FamilyHistoryCondition.created_at.desc())
    )
    result = await db.execute(stmt)
    conditions = result.scalars().all()

    for condition in conditions:
        condition._plaintext_dek = plaintext_dek
        
    return conditions


# Crear un nuevo antecedente familiar
@router.post("", response_model=FamilyHistoryConditionOut, status_code=status.HTTP_201_CREATED)
async def create_family_history_condition(
    condition_data: FamilyHistoryConditionCreate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek

    new_condition = FamilyHistoryCondition(family_id=family.id)
    new_condition._plaintext_dek = plaintext_dek
    
    new_condition.condition_name = condition_data.condition_name
    new_condition.relative = condition_data.relative
    new_condition.notes = condition_data.notes
    
    db.add(new_condition)
    await db.commit()
    await db.refresh(new_condition)
    
    new_condition._plaintext_dek = plaintext_dek
    return new_condition


# Actualizar un antecedente familiar existente
@router.put("/{condition_id}", response_model=FamilyHistoryConditionOut)
async def update_family_history_condition(
    condition_id: int,
    condition_data: FamilyHistoryConditionUpdate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek
    
    condition = await db.get(FamilyHistoryCondition, condition_id)

    if not condition or condition.family_id != family.id:
        raise HTTPException(status_code=404, detail="Antecedente no encontrado")

    condition._plaintext_dek = plaintext_dek
    
    for key, value in condition_data.model_dump(exclude_unset=True).items():
        setattr(condition, key, value)

    await db.commit()
    await db.refresh(condition)
    
    condition._plaintext_dek = plaintext_dek
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
