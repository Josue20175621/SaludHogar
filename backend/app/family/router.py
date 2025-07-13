from fastapi import APIRouter, Depends, status, HTTPException
# from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.schemas import FamilyForm, FamilyMemberForm, FamilyOut, FamilyMemberOut, DashboardStats
from app.models import Family, FamilyMember, Appointment, Medication, Vaccination
from app.database import get_db
from .dependencies import get_current_active_family

router = APIRouter(prefix="/families/{family_id}", tags=["Family"])

@router.get("/members", response_model=list[FamilyMemberOut])
async def get_family_members(family: Family = Depends(get_current_active_family)):
    """Get the current user's family's members."""
    return family.members

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

    # Count active medications (assuming empty end_date means active (who wrote this nonsense))
    stmt_medications = select(func.count(Medication.id)).where(
        Medication.family_id == current_family.id,
        Medication.end_date == None
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
    family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    """Update the name of the current user's family."""
    family.name = form.name
    await db.commit()
    await db.refresh(family, ["members"])
    return family

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family(
    family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    await db.delete(family)
    await db.commit()

@router.post("/members", response_model=FamilyMemberOut, status_code=status.HTTP_201_CREATED)
async def add_member(member: FamilyMemberForm, family: Family = Depends(get_current_active_family), db: AsyncSession = Depends(get_db)):
    m = FamilyMember(**member.model_dump(), family_id=family.id)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m

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

    if member is None: raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.commit()

@router.patch("/members/{member_id}", response_model=FamilyMemberOut)
async def update_member(
    member_id: int,
    data: FamilyMemberForm,
    family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FamilyMember).join(Family).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )
    member = (await db.execute(stmt)).scalar_one_or_none()

    if member is None: raise HTTPException(status_code=404, detail="Member not found or not authorized")

    # Get a dict of only the fields that were sent in the request
    update_data = data.model_dump(exclude_unset=True)

    # Update the member model with the new data
    for key, value in update_data.items():
        setattr(member, key, value)
    
    await db.commit()
    await db.refresh(member)
    return member