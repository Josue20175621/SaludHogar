from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.database import get_db
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.family.dependencies import get_current_active_family
from app.schemas import MedicationOut
from app.models import Medication, Family

router = APIRouter(
    prefix="/families/{family_id}/medications",
    tags=["Medications"]
)

@router.get("", response_model=list[MedicationOut])
async def get_all_medications_for_family(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db),
    
    active: Optional[bool] = Query(default=None, description="Filter for active medications (end_date is NULL)"),
    
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="start_date", description="Field to sort by"),
    sort_order: str = Query(default="desc", description="Sort order: 'asc' or 'desc'")
):
    stmt = select(Medication).where(
        Medication.family_id == current_family.id
    )

    if active is True:
        today = func.current_date() # Get the current date from the database server
        
        stmt = stmt.where(
            Medication.start_date <= today,
            or_(
                Medication.end_date == None,
                Medication.end_date >= today
            )
        )
    elif active is False:
        # An inactive medication is one that has not started yet OR has already ended.
        today = func.current_date()

        stmt = stmt.where(
            or_(
                Medication.start_date > today,
                Medication.end_date < today
            )
        )

    sort_column = getattr(Medication, sort_by, None)
    
    # List of allowed sortable columns for added security
    allowed_sort_columns = ["start_date", "name", "created_at"] # no ePHI
    
    if sort_by in allowed_sort_columns and sort_column is not None:
        if sort_order.lower() == 'asc':
            stmt = stmt.order_by(sort_column.asc())
        else:
            stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(Medication.start_date.desc())

    stmt = stmt.offset(offset).limit(limit)

    
    medications = (await db.scalars(stmt)).all()
    return medications