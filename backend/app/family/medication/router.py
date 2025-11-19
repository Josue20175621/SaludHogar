from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.database import get_db
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family, get_family_and_dek
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
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek),
    active: Optional[bool] = Query(default=None, description="Filter for active medications"),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="start_date", description="Field to sort by"),
    sort_order: str = Query(default="desc", description="Sort order: 'asc' or 'desc'")
):
    family, plaintext_dek = family_and_dek
    stmt = select(Medication).where(Medication.family_id == family.id)
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
    allowed_sort_columns = ["start_date", "created_at"] # no ePHI
    if sort_by in allowed_sort_columns and sort_column:
        if sort_order.lower() == 'asc': stmt = stmt.order_by(sort_column.asc())
        else: stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(Medication.start_date.desc())

    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    medications = result.scalars().all()

    for med in medications:
        med._plaintext_dek = plaintext_dek
    return medications

@router.post("", status_code=status.HTTP_201_CREATED, response_model=MedicationOut)
async def create_medication(
    medication_data: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek

    member_check = await db.get(FamilyMember, medication_data.member_id)
    if not member_check or member_check.family_id != family.id:
        raise HTTPException(status_code=404, detail=f"Miembro {medication_data.member_id} no encontrado")

    new_medication = Medication(
        family_id=family.id,
        member_id=medication_data.member_id,
        start_date=medication_data.start_date,
        end_date=medication_data.end_date,
        reminder_times=medication_data.reminder_times,
        reminder_days=medication_data.reminder_days
    )
    new_medication._plaintext_dek = plaintext_dek
    
    new_medication.name = medication_data.name
    new_medication.dosage = medication_data.dosage
    new_medication.frequency = medication_data.frequency
    new_medication.prescribed_by = medication_data.prescribed_by
    new_medication.notes = medication_data.notes
    
    db.add(new_medication)
    await db.commit()
    await db.refresh(new_medication)
    
    new_medication._plaintext_dek = plaintext_dek
    return new_medication

@router.patch("/{medication_id}", response_model=MedicationOut)
async def update_medication(
    medication_id: int,
    medication_data: MedicationUpdate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek
    
    medication_to_update = await db.get(Medication, medication_id)

    if not medication_to_update or medication_to_update.family_id != family.id:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    medication_to_update._plaintext_dek = plaintext_dek
    
    update_data = medication_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(medication_to_update, key, value)
        
    db.add(medication_to_update)
    await db.commit()
    
    await db.refresh(medication_to_update)
    
    medication_to_update._plaintext_dek = plaintext_dek
    return medication_to_update

@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: int,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    medication_to_delete = await db.get(Medication, medication_id)
    if not medication_to_delete or medication_to_delete.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicamento no encontrado")
    await db.delete(medication_to_delete)
    await db.commit()