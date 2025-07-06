from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from dotenv import load_dotenv

from app.config import settings
import redis.asyncio as redis
import os
from pathlib import Path

# Load .env file
path = Path(__file__).resolve().parents[2] / '.env'
load_dotenv(path)

DATABASE_URL = os.getenv("DATABASE_URL")

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