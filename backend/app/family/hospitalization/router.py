from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Hospitalization, FamilyMember
from app.schemas import HospitalizationOut

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Hospitalizations"]
)

@router.get("/hospitalizations", response_model=list[HospitalizationOut])
async def get_member_hospitalizations(member: FamilyMember = Depends(get_target_member), db: AsyncSession = Depends(get_db)):
    stmt = select(Hospitalization).where(Hospitalization.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()