from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Allergy, Family, FamilyMember
from app.schemas import AllergyOut

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Allergies"]
)

@router.get("/allergies", response_model=list[AllergyOut])
async def get_member_allergies(member: FamilyMember = Depends(get_target_member), db: AsyncSession = Depends(get_db)):
    stmt = select(Allergy).where(Allergy.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()