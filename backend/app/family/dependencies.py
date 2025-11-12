from fastapi import Depends, HTTPException, status, Path
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Family, User, FamilyMembership, FamilyMember
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.security import encryption

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

# A dependency to get and validate the member
async def get_target_member(
    member_id: int, 
    current_family: Family = Depends(get_current_active_family),
    db: AsyncSession = Depends(get_db)
) -> FamilyMember:
    member = await db.get(FamilyMember, member_id)
    if not member or member.family_id != current_family.id:
        raise HTTPException(status_code=404, detail="Family member not found")
    return member

async def get_family_and_dek(
    family: Family = Depends(get_current_active_family)
) -> tuple[Family, bytes]:
    """
    A dependency that returns the authorized Family object AND its decrypted DEK.
    This is the single source of truth for accessing encrypted family data.
    """
    family_key_record = family.encryption_key
    if not family_key_record:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Critical: Encryption key not found"
        )
    
    plaintext_dek = encryption.decrypt_dek(family_key_record.encrypted_dek)
    
    return (family, plaintext_dek)