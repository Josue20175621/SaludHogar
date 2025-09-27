from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_current_active_family
from app.models import FamilyHistoryCondition, Family
from app.schemas import FamilyHistoryConditionOut

router = APIRouter(
    prefix="/families/{family_id}/history",
    tags=["Family History"]
)

@router.get("", response_model=list[FamilyHistoryConditionOut])
async def get_all_family_history(
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FamilyHistoryCondition).where(
        FamilyHistoryCondition.family_id == current_family.id
    ).order_by(FamilyHistoryCondition.condition_name) # Sort alphabetically by default
    
    result = await db.execute(stmt)
    conditions = result.scalars().all()
    return conditions
