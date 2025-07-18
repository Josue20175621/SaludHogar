from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.database import get_db
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family
from app.models import Medication, Family, FamilyMember
from app.schemas import (
    MedicationOut,
    MedicationCreate,
    MedicationUpdate,
)

router = APIRouter(
    prefix="/families/{family_id}/medications",
    tags=["Medications"]
)

@router.get("", response_model=list[MedicationOut])
async def get_all_medications_for_family(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db),
    
    active: Optional[bool] = Query(default=None, description="Filter for active medications"),
    
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="start_date", description="Field to sort by"),
    sort_order: str = Query(default="desc", description="Sort order: 'asc' or 'desc'")
):
    stmt = select(Medication).where(Medication.family_id == current_family.id)
    today = func.current_date()

    if active is True:
        stmt = stmt.where(
            Medication.start_date <= today,
            or_(Medication.end_date == None, Medication.end_date >= today)
        )
    elif active is False:
        stmt = stmt.where(
            or_(Medication.start_date > today, Medication.end_date < today)
        )

    sort_column = getattr(Medication, sort_by, None)
    allowed_sort_columns = ["start_date", "name", "created_at"] # no ePHI
    if sort_by in allowed_sort_columns and sort_column:
        if sort_order.lower() == 'asc': stmt = stmt.order_by(sort_column.asc())
        else: stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(Medication.start_date.desc())

    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    medications = result.scalars().all()
    return medications

@router.post("", status_code=status.HTTP_201_CREATED, response_model=MedicationOut)
async def create_medication(
    medication_data: MedicationCreate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    # Ensure the member_id provided belongs to the current family.
    member_check = await db.get(FamilyMember, medication_data.member_id)
    if not member_check or member_check.family_id != current_family.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Family member with id {medication_data.member_id} not found in this family."
        )

    new_medication = Medication(**medication_data.model_dump(), family_id=current_family.id)
    
    db.add(new_medication)
    await db.commit()
    await db.refresh(new_medication, attribute_names=['member'])
    
    return new_medication

@router.patch("/{medication_id}", response_model=MedicationOut)
async def update_medication(
    medication_id: int,
    medication_data: MedicationUpdate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    medication_to_update = await db.get(Medication, medication_id)

    if not medication_to_update or medication_to_update.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    # They want to change the member_id, i don't know about that
    if medication_data.member_id:
        member_check = await db.get(FamilyMember, medication_data.member_id)
        if not member_check or member_check.family_id != current_family.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Family member with id {medication_data.member_id} not found in this family."
            )

    # Update the model with provided fields only
    update_data = medication_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(medication_to_update, key, value)
        
    db.add(medication_to_update)
    await db.commit()
    
    await db.refresh(medication_to_update, attribute_names=['member'])
    return medication_to_update

@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: int,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    medication_to_delete = await db.get(Medication, medication_id)
    if not medication_to_delete or medication_to_delete.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    await db.delete(medication_to_delete)
    await db.commit()