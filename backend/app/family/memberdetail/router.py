from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import FamilyMember, Appointment, Medication, Vaccination
from app.schemas import AppointmentOut, MedicationOut, VaccinationOut


router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Member Health Records"]
)

@router.get("/appointments", response_model=List[AppointmentOut])
async def get_member_appointments(
    # This dependency will automatically get the member from the URL
    # and validate their ownership.
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all appointments for a specific family member.
    """
    stmt = select(Appointment).where(
        Appointment.member_id == target_member.id
    ).order_by(Appointment.appointment_date.desc())
    
    result = await db.execute(stmt)
    appointments = result.scalars().all()
    return appointments


@router.get("/medications", response_model=List[MedicationOut])
async def get_member_medications(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all medications for a specific family member.
    """
    stmt = select(Medication).where(
        Medication.member_id == target_member.id
    ).order_by(Medication.start_date.desc())
    
    result = await db.execute(stmt)
    medications = result.scalars().all()
    return medications

@router.get("/vaccinations", response_model=List[VaccinationOut])
async def get_member_vaccinations(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all vaccinations for a specific family member.
    """
    stmt = select(Vaccination).where(
        Vaccination.member_id == target_member.id
    ).order_by(Vaccination.date_administered.desc())
    
    result = await db.execute(stmt)
    vaccinations = result.scalars().all()
    return vaccinations