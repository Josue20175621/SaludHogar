from datetime import date
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional

class LoginForm(BaseModel):
    email: EmailStr
    password: str

class RegisterForm(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class FamilyForm(BaseModel):
    name: str

class FamilyMemberForm(BaseModel):
    first_name: str
    last_name: str
    birth_date: Optional[date]
    gender: Optional[str]
    relation: Optional[str]
    blood_type: Optional[str]
    phone_number: Optional[str]

class FamilyMemberUpdateForm(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    relation: Optional[str] = None
    blood_type: Optional[str] = None
    phone_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr

    # Tell Pydantic that the data might come from a SQLAlchemy model
    model_config = ConfigDict(from_attributes=True)

class FamilyMemberOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    birth_date: Optional[date]
    gender: Optional[str]
    relation: Optional[str]
    blood_type: Optional[str]
    phone_number: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class FamilyOut(BaseModel):
    id: int
    name: str
    members: List[FamilyMemberOut] = []

    model_config = ConfigDict(from_attributes=True)

class TOTP(BaseModel):
    code: str
    token: str

class TOTPSetup(BaseModel):
    secret: str
    otp_auth_url: str

class TOTPVerifyRequest(BaseModel):
    secret: str
    totp_code: str