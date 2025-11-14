import pyotp
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy.orm import joinedload
from app.config import settings

from app.database import get_db
from app.models import User, Family, FamilyMembership
from app.auth.session import redis_client
from app.security.encryption import decrypt_dek

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Returns user if logged in, else raise HTTPException
    """
    # Get session ID from cookie
    sid = request.cookies.get(settings.COOKIE_NAME)
    if not sid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session cookie missing"
        )
    
    # Get user_id from Redis
    user_id = await redis_client.hget(f"sid:{sid}", "user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    # Get user from database
    user = await get_user_by_id(int(user_id), db)

    if user is None:
        # Cleanup orphaned session
        await redis_client.delete(f"sid:{sid}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_current_hydrated_user(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    This dependency takes an authenticated user, fetches all their family data,
    decrypts the necessary DEKs, and returns a fully "hydrated" User object
    whose encrypted fields can be accessed directly.
    """
    # Re-fetch the user with all relationships eagerly loaded in one go.
    # This is the most efficient way to get all the data.
    stmt = select(User).where(User.id == user.id).options(
        joinedload(User.memberships).joinedload(FamilyMembership.family).joinedload(Family.encryption_key)
    )
    hydrated_user = (await db.scalars(stmt)).first()

    if not hydrated_user or not hydrated_user.memberships:
        return user # Return the original user if no family info is found

    family = hydrated_user.memberships[0].family
    
    if family and family.encryption_key:
        plaintext_dek = decrypt_dek(family.encryption_key.encrypted_dek)

        hydrated_user._plaintext_dek = plaintext_dek
        family._plaintext_dek = plaintext_dek
    
    return hydrated_user

async def get_user_by_id(uid: int, db: AsyncSession) -> User | None: return (await db.scalars(select(User).where(User.id == uid))).first()

def totp_ok(secret: str, code: str, valid_window: int = 1) -> bool:
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=valid_window)
    except Exception:
        return False
