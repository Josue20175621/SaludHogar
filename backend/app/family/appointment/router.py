from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.database import get_db
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.family.dependencies import get_current_active_family
from app.models import Appointment, Family, FamilyMember
from app.schemas import AppointmentOut, AppointmentCreate, AppointmentUpdate

router = APIRouter(
    prefix="/families/{family_id}/appointments",
    tags=["Appointments"]
)

@router.get("", response_model=list[AppointmentOut])
async def get_all_appointments_for_family(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: Optional[str] = Query(default="appointment_date"),
    sort_order: Optional[str] = Query(default="desc"),
    future_appointments: bool = Query(default=False, description="Set to true to only fetch future appointments")
):
    stmt = (
        select(Appointment)
        .where(
            Appointment.family_id == current_family.id
        )
    )

    if future_appointments: stmt = stmt.where(Appointment.appointment_date >= func.now())

    # apply sorting
    sort_column = getattr(Appointment, sort_by, None)
    if sort_column is not None and hasattr(sort_column, 'asc'):
        order = sort_column.asc() if sort_order.lower() == 'asc' else sort_column.desc()
        stmt = stmt.order_by(order)
    else:
        stmt = stmt.order_by(Appointment.appointment_date.desc())

    # pagination
    stmt = stmt.offset(offset).limit(limit)

    return (await db.scalars(stmt)).all()

@router.post("", status_code=status.HTTP_201_CREATED, response_model=AppointmentOut)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    # Ensure member belongs to the family
    member_check = await db.get(FamilyMember, appointment_data.member_id)
    if not member_check or member_check.family_id != current_family.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Family member with id {appointment_data.member_id} not found in this family."
        )

    new_appointment = Appointment(
        **appointment_data.model_dump(),
        family_id=current_family.id
    )
    
    db.add(new_appointment)
    await db.commit()
    
    await db.refresh(new_appointment, attribute_names=['member'])
    
    return new_appointment

@router.patch("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    appointment_to_update = await db.get(Appointment, appointment_id)

    if not appointment_to_update or appointment_to_update.family_id != current_family.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # If the member_id is being changed, perform the same security check as in CREATE
    if appointment_data.member_id:
        member_check = await db.get(FamilyMember, appointment_data.member_id)
        if not member_check or member_check.family_id != current_family.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Family member with id {appointment_data.member_id} not found in this family."
            )
        
    # .model_dump(exclude_unset=True) is key for PATCH, it only includes fields that were provided.
    update_data = appointment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment_to_update, key, value)
        
    db.add(appointment_to_update)
    await db.commit()
    
    await db.refresh(appointment_to_update, attribute_names=['member'])
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