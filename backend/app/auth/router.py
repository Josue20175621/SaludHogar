from fastapi import APIRouter, Depends, status
from app.models import User
from app.schemas import UserOut
from app.auth.dependencies import get_current_user, handle_user_registration, handle_user_login, handle_user_logout

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: User = Depends(handle_user_registration)): return user

@router.post("/login", dependencies=[Depends(handle_user_login)])
async def login(): return {"msg": "Login successful"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(handle_user_logout)])
async def logout(): pass

@router.get("/me", response_model=UserOut)
async def get_current_user_info(user = Depends(get_current_user)): return user