from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.database import get_db
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.family.dependencies import get_current_active_family, get_family_and_dek
from app.models import Appointment, Family, FamilyMember
from app.schemas import AppointmentOut, AppointmentCreate, AppointmentUpdate

router = APIRouter(
    prefix="/families/{family_id}/appointments",
    tags=["Appointments"]
)

@router.get("", response_model=list[AppointmentOut])
async def get_all_appointments_for_family(
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: Optional[str] = Query(default="appointment_date"),
    sort_order: Optional[str] = Query(default="desc"),
    future_appointments: bool = Query(default=False, description="Set to true to only fetch future appointments")
):
    family, plaintext_dek = family_and_dek
    stmt = select(Appointment).where(Appointment.family_id == family.id)

    if future_appointments: stmt = stmt.where(Appointment.appointment_date >= func.now())

    # apply sorting
    sort_column = getattr(Appointment, sort_by, None)
    # Only allow sorting by date or creation time, not encrypted names/specialties.
    allowed_sort_columns = ["appointment_date", "created_at"]
    if sort_by in allowed_sort_columns and sort_column is not None:
        order = sort_column.asc() if sort_order.lower() == 'asc' else sort_column.desc()
        stmt = stmt.order_by(order)
    else:
        stmt = stmt.order_by(Appointment.appointment_date.desc())

    # pagination
    stmt = stmt.offset(offset).limit(limit)

    result = await db.scalars(stmt)
    appointments = result.all()

    for appt in appointments:
        appt._plaintext_dek = plaintext_dek

    return appointments

@router.post("", status_code=status.HTTP_201_CREATED, response_model=AppointmentOut)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek

    member_check = await db.get(FamilyMember, appointment_data.member_id)
    if not member_check or member_check.family_id != family.id:
        raise HTTPException(status_code=404, detail=f"Miembro {appointment_data.member_id} no esta en la familia.")

    new_appointment = Appointment(
        family_id=family.id,
        member_id=appointment_data.member_id,
        appointment_date=appointment_data.appointment_date
    )
    new_appointment._plaintext_dek = plaintext_dek
    
    new_appointment.doctor_name = appointment_data.doctor_name
    new_appointment.specialty = appointment_data.specialty
    new_appointment.location = appointment_data.location
    new_appointment.notes = appointment_data.notes
    
    db.add(new_appointment)
    await db.commit()
    await db.refresh(new_appointment)

    new_appointment._plaintext_dek = plaintext_dek
    return new_appointment

@router.patch("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    family_and_dek: tuple[Family, bytes] = Depends(get_family_and_dek)
):
    family, plaintext_dek = family_and_dek
    appointment_to_update = await db.get(Appointment, appointment_id)

    if not appointment_to_update or appointment_to_update.family_id != family.id:
        raise HTTPException(status_code=404, detail="No se encontro la cita")

    appointment_to_update._plaintext_dek = plaintext_dek
    
    update_data = appointment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment_to_update, key, value)
        
    db.add(appointment_to_update)
    await db.commit()
    await db.refresh(appointment_to_update)
    
    appointment_to_update._plaintext_dek = plaintext_dek
    return appointment_to_update

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    appointment_to_delete = await db.get(Appointment, appointment_id)

    if not appointment_to_delete or appointment_to_delete.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    await db.delete(appointment_to_delete)
    await db.commit()