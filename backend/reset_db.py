import asyncio
from sqlalchemy import text
from dotenv import load_dotenv
from pathlib import Path
import os

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(env_path)

from app.database import engine
from app.models import Base

async def reset_database():
    """
    Drops all tables and re-creates them based on the current SQLAlchemy models.
    """
    print("Starting Database Reset")
    
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        print("All tables dropped and schema recreated.")

        print("Creating all tables from Base.metadata...")
        await conn.run_sync(Base.metadata.create_all)
        print("Database schema created successfully.")
    
    print("Database Reset Complete")

    await engine.dispose()

if __name__ == "__main__":
    if not os.getenv("DATABASE_URL"):
        print("DATABASE_URL not found. Make sure your .env file is configured.")
    else:
        asyncio.run(reset_database())