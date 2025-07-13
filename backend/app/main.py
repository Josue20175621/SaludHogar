from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine
from app.models import Base
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.family.router import router as family_router
from app.family.appointment.router import router as appointment_router
from app.family.medication.router import router as medication_router
from app.family.vaccination.router import router as vaccination_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield  # App runs here
    # Shutdown: Clean up resources if needed
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(family_router)
app.include_router(appointment_router)
app.include_router(medication_router)
app.include_router(vaccination_router)