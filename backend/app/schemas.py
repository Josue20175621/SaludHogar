from datetime import datetime, date
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional

class LoginForm(BaseModel):
    email: EmailStr
    password: str

class RegisterForm(BaseModel):
    first_name: str
    last_name: str
    family_name: str
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

class FamilySummaryOut(BaseModel):
    id: int
    name: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    
    # This is the new, crucial part
    families: List[FamilySummaryOut] 

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

class DashboardStats(BaseModel):
    member_count: int
    upcoming_appointment_count: int
    active_medication_count: int
    vaccination_record_count: int

class AppointmentOut(BaseModel):
    id: int
    family_id: int
    member_id: int
    appointment_date: datetime
    doctor_name: str
    specialty: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MedicationOut(BaseModel):
    id: int
    member_id: int
    name: str
    dosage: str
    frequency: str
    start_date: Optional[date]
    end_date: Optional[date]
    prescribed_by: Optional[str]
    notes: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class VaccinationOut(BaseModel):
    id: int
    member_id: int
    vaccine_name: str
    date_administered: date
    administered_by: Optional[str]
    notes: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)