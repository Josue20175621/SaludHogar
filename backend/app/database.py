from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import settings
import redis.asyncio as redis
import os

DATABASE_URL: str | None = os.getenv("DATABASE_URL")

if DATABASE_URL is None: raise ValueError("DATABASE_URL environment variable is not set. Please create a .env file.")

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    expire_on_commit=False,
    autoflush=False,
    bind=engine
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception:
            await db.rollback()
            raise

redis_client: redis.Redis = redis.from_url(settings.REDIS_URL, decode_responses=True)