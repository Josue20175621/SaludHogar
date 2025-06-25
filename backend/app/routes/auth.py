from fastapi import APIRouter
from models.auth import User

router = APIRouter()

@router.post("/login")
async def login(data: User):
    return {"message": f"Login {data.email}"}

@router.post("/register")
async def register(data: User):
    return {"message": f"Register {data.email}"}
