from fastapi import APIRouter, Depends, status, Query, HTTPException
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family, get_family_and_dek
from app.models import Vaccination, Family, FamilyMember
from app.schemas import (
    VaccinationOut,
    VaccinationCreate,
    VaccinationUpdate,
)

router = APIRouter(
    prefix="/families/{family_id}/vaccinations",
    tags=["Vaccinations"]
)

@router.get("", response_model=list[VaccinationOut])
async def get_all_vaccinations_for_family(
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="date_administered"),
    sort_order: str = Query(default="desc")
):
    family, plaintext_dek = family_and_dek
    
    stmt = select(Vaccination).where(Vaccination.family_id == family.id)

    sort_column = getattr(Vaccination, sort_by, None)
    allowed_sort_columns = ["date_administered", "created_at"]
    if sort_by in allowed_sort_columns and sort_column is not None:
        stmt = stmt.order_by(sort_column.desc() if sort_order.lower() == 'desc' else sort_column.asc())
    else:
        stmt = stmt.order_by(Vaccination.date_administered.desc())
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    vaccinations = result.scalars().all()
    
    for vax in vaccinations:
        vax._plaintext_dek = plaintext_dek
    
    return vaccinations

@router.post("", status_code=status.HTTP_201_CREATED, response_model=VaccinationOut)
async def create_vaccination(
    vaccination_data: VaccinationCreate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek
    
    member_check = await db.get(FamilyMember, vaccination_data.member_id)
    if not member_check or member_check.family_id != family.id:
        raise HTTPException(status_code=404, detail=f"Member with id {vaccination_data.member_id} not found.")

    new_vaccination = Vaccination(
        family_id=family.id,
        member_id=vaccination_data.member_id,
        date_administered=vaccination_data.date_administered
    )
    new_vaccination._plaintext_dek = plaintext_dek
    
    new_vaccination.vaccine_name = vaccination_data.vaccine_name
    new_vaccination.administered_by = vaccination_data.administered_by
    new_vaccination.notes = vaccination_data.notes
    
    db.add(new_vaccination)
    await db.commit()
    await db.refresh(new_vaccination)
    
    new_vaccination._plaintext_dek = plaintext_dek
    return new_vaccination

@router.patch("/{vaccination_id}", response_model=VaccinationOut)
async def update_vaccination(
    vaccination_id: int,
    vaccination_data: VaccinationUpdate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek
    
    vaccination_to_update = await db.get(Vaccination, vaccination_id)

    if not vaccination_to_update or vaccination_to_update.family_id != family.id:
        raise HTTPException(status_code=404, detail="Vaccination record not found")

    vaccination_to_update._plaintext_dek = plaintext_dek
    
    update_data = vaccination_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vaccination_to_update, key, value)
        
    db.add(vaccination_to_update)
    await db.commit()
    
    await db.refresh(vaccination_to_update)
    
    vaccination_to_update._plaintext_dek = plaintext_dek
    return vaccination_to_update

@router.delete("/{vaccination_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vaccination(
    vaccination_id: int,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    vaccination_to_delete = await db.get(Vaccination, vaccination_id)

    if not vaccination_to_delete or vaccination_to_delete.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination record not found")

    await db.delete(vaccination_to_delete)
    await db.commit()