from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Family, User
from app.database import get_db
from app.auth.dependencies import get_current_user

async def get_current_user_family(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Family:
    stmt = select(Family).where(Family.owner_id == user.id).options(selectinload(Family.members))
    family = (await db.scalars(stmt)).first()
    
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not created a family yet."
        )
    return family