from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Condition, FamilyMember
from app.schemas import ConditionOut

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Conditions"]
)

@router.get("/conditions", response_model=list[ConditionOut])
async def get_member_conditions(member: FamilyMember = Depends(get_target_member), db: AsyncSession = Depends(get_db)):
    stmt = select(Condition).where(Condition.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()