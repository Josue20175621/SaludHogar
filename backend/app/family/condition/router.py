from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member, get_hydrated_target_member
from app.models import Condition, FamilyMember
from app.schemas import ConditionOut, ConditionCreate, ConditionUpdate

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Conditions"]
)

@router.get("/conditions", response_model=list[ConditionOut])
async def get_member_conditions(
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Condition).where(Condition.member_id == member.id).order_by(Condition.date_diagnosed.desc())
    result = await db.execute(stmt)
    conditions = result.scalars().all()

    for condition in conditions:
        condition._plaintext_dek = plaintext_dek
        
    return conditions

@router.post("/conditions", response_model=ConditionOut, status_code=status.HTTP_201_CREATED)
async def create_condition(
    data: ConditionCreate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    new_condition = Condition(
        family_id=member.family_id,
        member_id=member.id,
        date_diagnosed=data.date_diagnosed,
        is_active=data.is_active
    )
    new_condition._plaintext_dek = plaintext_dek
    
    new_condition.name = data.name
    new_condition.notes = data.notes

    db.add(new_condition)
    await db.commit()
    await db.refresh(new_condition)
    
    new_condition._plaintext_dek = plaintext_dek
    return new_condition

@router.put("/conditions/{condition_id}", response_model=ConditionOut)
async def update_condition(
    condition_id: int,
    data: ConditionUpdate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Condition).where(Condition.id == condition_id, Condition.member_id == member.id)
    result = await db.execute(stmt)
    condition = result.scalar_one_or_none()

    if not condition:
        raise HTTPException(status_code=404, detail="Condicion no encontrada")

    condition._plaintext_dek = plaintext_dek
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(condition, key, value)

    await db.commit()
    await db.refresh(condition)
    
    condition._plaintext_dek = plaintext_dek
    return condition

@router.delete("/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_condition(
    condition_id: int,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Condition).where(Condition.id == condition_id, Condition.member_id == member.id)
    result = await db.execute(stmt)
    condition = result.scalar_one_or_none()

    if not condition:
        raise HTTPException(status_code=404, detail="Condicion no encontrada")

    await db.delete(condition)
    await db.commit()
