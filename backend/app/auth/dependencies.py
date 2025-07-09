import pyotp
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession 
from app.config import settings
from app.database import get_db
from app.models import User
from app.auth.session import redis_client

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

async def get_user_by_id(uid: int, db: AsyncSession) -> User | None: return (await db.scalars(select(User).where(User.id == uid))).first()

def totp_ok(secret: str, code: str, valid_window: int = 1) -> bool:
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=valid_window)
    except Exception:
        return False
