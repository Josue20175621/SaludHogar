from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import LoginForm, RegisterForm, UserOut
from models import User
from database import get_db
from security.passwords import hash_password, verify_password
import redis.asyncio as redis
import os, secrets

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SESSION_TTL = 60 * 60 * 24 * 30
SID_BYTES   = 32 # 256-bit
COOKIE_NAME = "sid"

# Redis persistence
r: redis.Redis = redis.from_url(REDIS_URL, decode_responses=True)

def new_sid() -> str: return secrets.token_urlsafe(SID_BYTES)

async def store_session(sid: str, user_id: int):
    key = f"sid:{sid}"
    await r.hset(key, mapping={"user_id": user_id})
    await r.expire(key, SESSION_TTL)

async def delete_session(sid: str | None):
    if sid: await r.delete(f"sid:{sid}")

async def get_session_user(sid: str | None, db : AsyncSession) -> User | None:
    if not sid: return None
    user_id = await r.hget(f"sid:{sid}", "user_id")
    if not user_id: return None
    stmt = select(User).where(User.id == int(user_id))
    return (await db.execute(stmt)).scalars().first()
    
def clear_cookie(resp: Response):
    resp.delete_cookie(
        COOKIE_NAME,
        path="/",
        samesite="None",
        secure=True,
    )

def set_cookie(resp: Response, sid: str):
    resp.set_cookie(
        COOKIE_NAME, sid,
        max_age=SESSION_TTL,
        secure=True,
        httponly=True,
        samesite="None",
        path="/",
    )

async def current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    sid = request.cookies.get(COOKIE_NAME)
    user = await get_session_user(sid, db)

    if user is None:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail      = "Not authenticated",
        )
    return user

@app.post("/login")
async def login(data: LoginForm, response: Response, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == data.email)
    db_user = (await db.execute(stmt)).scalars().first()

    if not db_user or not verify_password(data.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    session_id = new_sid()
    await r.hset(f"sid:{session_id}", "user_id", str(db_user.id))
    await r.expire(f"sid:{session_id}", SESSION_TTL)

    set_cookie(response, session_id)

    return {"msg": "Login successful"}

@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterForm, resp: Response, db: AsyncSession = Depends(get_db)):
    exists = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalars().first()

    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = User(fullname=payload.fullname, email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    sid = new_sid()
    await store_session(sid, user.id)
    set_cookie(resp, sid)

    return user

@app.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, resp: Response):
    sid = request.cookies.get(COOKIE_NAME)
    await delete_session(sid)

    resp = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_cookie(resp)
    return resp

@app.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)):
    return user