from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.schemas import FamilyForm, FamilyMemberForm, FamilyOut, FamilyMemberOut, DashboardStats
from app.models import Family, FamilyMember, Appointment, Medication, Vaccination
from app.database import get_db
from .dependencies import get_current_active_family, get_family_and_dek

router = APIRouter(prefix="/families/{family_id}", tags=["Family"])

@router.get("/members", response_model=list[FamilyMemberOut])
async def get_family_members(
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    """Get the current user's family's members."""
    family, plaintext_dek = family_and_dek

    # Hydrate each member object with the key before returning
    for member in family.members:
        member._plaintext_dek = plaintext_dek
    
    return family.members

@router.get("/members/{member_id}", response_model=FamilyMemberOut)
async def get_family_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):  
    family, plaintext_dek = family_and_dek

    stmt = select(FamilyMember).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )
    member = (await db.execute(stmt)).scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="No se encontro el miembro de la familia.")
        
    # Hydrate the single member object before returning
    member._plaintext_dek = plaintext_dek
        
    return member

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    
    # Count family members
    stmt_members = select(func.count(FamilyMember.id)).where(
        FamilyMember.family_id == current_family.id
    )

    # Count upcoming appointments
    stmt_appointments = select(func.count(Appointment.id)).where(
        Appointment.family_id == current_family.id,
        Appointment.appointment_date >= func.now() # func.now() gets the current DB time
    )

    # Count active medications
    stmt_medications = (
        select(func.count(Medication.id))
        .where(
            Medication.family_id == current_family.id,
            Medication.start_date <= func.current_date(),
            or_(
                Medication.end_date == None,
                Medication.end_date > func.current_date()
            )
        )
    )
    
    # Count total vaccination records
    stmt_vaccinations = select(func.count(Vaccination.id)).where(
        Vaccination.family_id == current_family.id
    )

    import asyncio
    
    member_count_task = db.scalar(stmt_members)
    appointment_count_task = db.scalar(stmt_appointments)
    medication_count_task = db.scalar(stmt_medications)
    vaccination_count_task = db.scalar(stmt_vaccinations)

    (
        member_count,
        appointment_count,
        medication_count,
        vaccination_count,
    ) = await asyncio.gather(
        member_count_task,
        appointment_count_task,
        medication_count_task,
        vaccination_count_task,
    )

    return {
        "member_count": member_count,
        "upcoming_appointment_count": appointment_count,
        "active_medication_count": medication_count,
        "vaccination_record_count": vaccination_count
    }

@router.patch("", response_model=FamilyOut)
async def update_family(
    form: FamilyForm,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    """Update the name of the current user's family."""
    family, plaintext_dek = family_and_dek

    family._plaintext_dek = plaintext_dek
    
    family.name = form.name
    
    await db.commit()
    await db.refresh(family, ["members"])
    
    family._plaintext_dek = plaintext_dek
    for member in family.members:
        member._plaintext_dek = plaintext_dek

    return family

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family(
    family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    await db.delete(family)
    await db.commit()

@router.post("/members", response_model=FamilyMemberOut, status_code=status.HTTP_201_CREATED)
async def add_member(
    form: FamilyMemberForm,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek

    # Create a new, partially empty member object.
    new_member = FamilyMember(family_id=family.id)
    new_member._plaintext_dek = plaintext_dek

    new_member.first_name = form.first_name
    new_member.last_name = form.last_name
    new_member.relation = form.relation
    new_member.birth_date = form.birth_date
    new_member.gender = form.gender
    new_member.blood_type = form.blood_type # Encrypted
    new_member.phone_number = form.phone_number # Encrypted
    new_member.tobacco_use = form.tobacco_use # Encrypted
    new_member.alcohol_use = form.alcohol_use # Encrypted
    new_member.occupation = form.occupation # Encrypted

    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    new_member._plaintext_dek = plaintext_dek
    
    return new_member

@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: int,
    family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FamilyMember).join(Family).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )
    member = (await db.execute(stmt)).scalar_one_or_none()

    if member is None: raise HTTPException(status_code=404, detail="Miembro no encontrado.")

    await db.delete(member)
    await db.commit()

@router.patch("/members/{member_id}", response_model=FamilyMemberOut)
async def update_member(
    member_id: int,
    data: FamilyMemberForm,
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek),
    db: AsyncSession = Depends(get_db)
):
    family, plaintext_dek = family_and_dek

    stmt = select(FamilyMember).join(Family).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )

    member = (await db.execute(stmt)).scalar_one_or_none()

    if member is None: raise HTTPException(status_code=404, detail="Miembro no encontrado o no autorizado")

    # Hydrate the fetched object so the setters will work
    member._plaintext_dek = plaintext_dek

    # Get a dict of only the fields that were sent in the request
    update_data = data.model_dump(exclude_unset=True)

    # Update the member model with the new data
    for key, value in update_data.items():
        setattr(member, key, value)
    
    await db.commit()
    await db.refresh(member)

    # Re-hydrate after refresh for the response
    member._plaintext_dek = plaintext_dek
    return member