from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.family.dependencies import get_current_active_family
from app.models import Appointment, Family
from app.schemas import AppointmentOut

router = APIRouter(
    prefix="/families/{family_id}/appointments",
    tags=["Appointments"]
)

@router.get("", response_model=list[AppointmentOut])
async def get_all_appointments_for_family(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db),
    
    # For pagination/limiting results
    limit: int = Query(default=100, ge=1, le=200, description="Number of results to return"),
    offset: int = Query(default=0, ge=0, description="Number of results to skip"),
    
    # For sorting
    sort_by: Optional[str] = Query(default="appointment_date", description="Field to sort by"),
    sort_order: Optional[str] = Query(default="desc", description="Sort order: 'asc' or 'desc'")
):
    stmt = select(Appointment).where(
        Appointment.family_id == current_family.id
    )

    sort_column = getattr(Appointment, sort_by, None)
    
    if sort_column is not None:
        if sort_order.lower() == 'asc': stmt = stmt.order_by(sort_column.asc())
        else: stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(Appointment.appointment_date.desc())

    stmt = stmt.offset(offset).limit(limit)

    appointments = (await db.scalars(stmt)).all()
    return appointments
