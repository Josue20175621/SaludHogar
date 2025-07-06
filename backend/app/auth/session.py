import secrets
from fastapi import Response
from app.database import redis_client
from app.config import settings

def new_sid() -> str:
    return secrets.token_urlsafe(settings.SID_BYTES)

async def store_session(sid: str, user_id: int):
    key = f"sid:{sid}"
    await redis_client.hset(key, mapping={"user_id": user_id})
    await redis_client.expire(key, settings.SESSION_TTL)

async def delete_session(sid: str | None):
    if sid:
        await redis_client.delete(f"sid:{sid}")

def set_auth_cookie(resp: Response, sid: str):
    resp.set_cookie(
        settings.COOKIE_NAME, sid,
        max_age=settings.SESSION_TTL,
        secure=settings.COOKIE_SECURE,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        path=settings.COOKIE_PATH,
    )

def clear_auth_cookie(resp: Response):
    resp.delete_cookie(
        settings.COOKIE_NAME,
        path=settings.COOKIE_PATH,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )