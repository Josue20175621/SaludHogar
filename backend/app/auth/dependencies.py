from fastapi import Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import LoginForm, RegisterForm
from app.security.passwords import hash_password, verify_password
from app.auth.session import store_session, set_auth_cookie, clear_auth_cookie, new_sid, redis_client

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
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
    stmt = select(User).where(User.id == int(user_id))
    user = (await db.execute(stmt)).scalars().first()

    if user is None:
        # Cleanup orphaned session
        await redis_client.delete(f"sid:{sid}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def handle_user_login(
    response: Response, form: LoginForm, db: AsyncSession = Depends(get_db)
) -> User:
    stmt = select(User).where(User.email == form.email)
    user = (await db.scalars(stmt)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    
    sid = new_sid()
    await store_session(sid, user.id)
    set_auth_cookie(response, sid)
    
    return user

async def handle_user_logout(request: Request, response: Response):
    """
    Dependency to handle user logout by deleting the session and clearing the cookie.
    """
    sid = request.cookies.get(settings.COOKIE_NAME)
    if sid: await redis_client.delete(f"sid:{sid}")
    clear_auth_cookie(response)

async def handle_user_registration(
    response: Response, form: RegisterForm, db: AsyncSession = Depends(get_db)
) -> User:
    if (await db.scalars(select(User).where(User.email == form.email))).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    
    new_user = User(
        email=form.email,
        first_name=form.first_name,
        last_name=form.last_name,
        password_hash=hash_password(form.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    sid = new_sid()
    await store_session(sid, new_user.id)
    set_auth_cookie(response, sid)
    
    return new_user