from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Surgery, FamilyMember
from app.schemas import SurgeryOut

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Surgeries"]
)

@router.get("/surgeries", response_model=list[SurgeryOut])
async def get_member_surgeries(member: FamilyMember = Depends(get_target_member), db: AsyncSession = Depends(get_db)):
    stmt = select(Surgery).where(Surgery.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()