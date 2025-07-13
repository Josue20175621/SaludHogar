from fastapi import Depends, HTTPException, status, Path
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Family, User, FamilyMembership
from app.database import get_db
from app.auth.dependencies import get_current_user

async def get_current_active_family(
    family_id: int = Path(..., title="The ID of the family to access"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Family:
    """
    A dependency that verifies user permission and returns the requested
    Family object, eagerly loading its members.
    """
    
    membership_stmt = select(FamilyMembership).where(
        FamilyMembership.user_id == user.id,
        FamilyMembership.family_id == family_id
    )
    membership = (await db.scalars(membership_stmt)).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this family's data."
        )
    
    # If permission is granted, fetch the family AND its members in one go.
    # probably fetch everything else too?
    family_stmt = select(Family).where(
        Family.id == family_id
    ).options(
        selectinload(Family.members)
    )
    family = (await db.scalars(family_stmt)).first()
    
    if not family:
         raise HTTPException(status_code=404, detail="Family not found.")

    return family