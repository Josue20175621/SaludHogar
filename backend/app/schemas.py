from pydantic import BaseModel, EmailStr, ConfigDict

class LoginForm(BaseModel):
    email: EmailStr
    password: str

class RegisterForm(BaseModel):
    fullname: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr

    # Tell Pydantic that the data might come from a SQLAlchemy model
    model_config = ConfigDict(from_attributes=True)
