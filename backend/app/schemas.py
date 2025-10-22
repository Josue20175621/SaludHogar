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
    tobacco_use: Optional[str]
    alcohol_use: Optional[str]
    occupation: Optional[str]

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
    profile_image_relpath: Optional[str]
    gender: Optional[str]
    relation: Optional[str]
    blood_type: Optional[str]
    phone_number: Optional[str]
    tobacco_use: Optional[str]
    alcohol_use: Optional[str]
    occupation: Optional[str]

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

class AppointmentBase(BaseModel):
    member_id: int
    doctor_name: str
    appointment_date: datetime
    specialty: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    member_id: Optional[int] = None
    doctor_name: Optional[str] = None
    appointment_date: Optional[datetime] = None
    specialty: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class FamilyMemberSummary(BaseModel):
    id: int
    first_name: str
    last_name: str
    
    model_config = ConfigDict(from_attributes=True)

class AppointmentOut(AppointmentBase):
    id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class MedicationBase(BaseModel):
    member_id: int
    name: str
    dosage: str
    frequency: str
    start_date: Optional[date]
    end_date: Optional[date]
    prescribed_by: Optional[str]
    notes: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None

class MedicationOut(MedicationBase):
    id: int
    family_id: int
    model_config = ConfigDict(from_attributes=True)

class VaccinationBase(BaseModel):
    vaccine_name: str
    date_administered: date
    administered_by: Optional[str]
    notes: Optional[str]
    
class VaccinationCreate(VaccinationBase):
    member_id: int

class VaccinationUpdate(BaseModel):
    vaccine_name: Optional[str] = None
    date_administered: Optional[date] = None
    administered_by: Optional[str] = None
    notes: Optional[str] = None

class VaccinationOut(VaccinationBase):
    id: int
    member_id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class AllergyBase(BaseModel):
    category: str
    name: str
    reaction: Optional[str] = None
    is_severe: bool = False

class AllergyCreate(AllergyBase):
    member_id: int

class AllergyUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    reaction: Optional[str] = None
    is_severe: Optional[bool] = None

class AllergyOut(AllergyBase):
    id: int
    member_id: int
    family_id: int
    
    model_config = ConfigDict(from_attributes=True)

class ConditionBase(BaseModel):
    name: str
    date_diagnosed: Optional[date] = None
    is_active: bool = True
    notes: Optional[str] = None

class ConditionCreate(ConditionBase):
    member_id: int

class ConditionUpdate(BaseModel):
    name: Optional[str] = None
    date_diagnosed: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class ConditionOut(ConditionBase):
    id: int
    member_id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class SurgeryBase(BaseModel):
    name: str
    date_of_procedure: date
    surgeon_name: Optional[str] = None
    facility_name: Optional[str] = None
    notes: Optional[str] = None

class SurgeryCreate(SurgeryBase):
    member_id: int

class SurgeryUpdate(BaseModel):
    name: Optional[str] = None
    date_of_procedure: Optional[date] = None
    surgeon_name: Optional[str] = None
    facility_name: Optional[str] = None
    notes: Optional[str] = None

class SurgeryOut(SurgeryBase):
    id: int
    member_id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class HospitalizationBase(BaseModel):
    reason: str
    admission_date: date
    discharge_date: Optional[date] = None
    facility_name: Optional[str] = None
    notes: Optional[str] = None

class HospitalizationCreate(HospitalizationBase):
    member_id: int

class HospitalizationUpdate(BaseModel):
    reason: Optional[str] = None
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    facility_name: Optional[str] = None
    notes: Optional[str] = None

class HospitalizationOut(HospitalizationBase):
    id: int
    member_id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class FamilyHistoryConditionBase(BaseModel):
    condition_name: str
    relative: str # e.g., "Mother", "Father", "Paternal Grandfather"
    notes: Optional[str] = None

class FamilyHistoryConditionCreate(FamilyHistoryConditionBase):
    pass

class FamilyHistoryConditionUpdate(BaseModel):
    condition_name: Optional[str] = None
    relative: Optional[str] = None
    notes: Optional[str] = None

class FamilyHistoryConditionOut(FamilyHistoryConditionBase):
    id: int
    family_id: int

    model_config = ConfigDict(from_attributes=True)

class MedicalReport(BaseModel):
    personal_information: FamilyMemberOut
    allergies: List[AllergyOut]
    current_medications: List[MedicationOut]
    vaccination_history: List[VaccinationOut]
    chronic_conditions: List[ConditionOut]
    surgical_history: List[SurgeryOut]
    hospitalizations: List[HospitalizationOut]
    family_medical_history: List[FamilyHistoryConditionOut]
    report_generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationOut(BaseModel):
    id: int
    user_id: int
    
    type: str
    message: str
    is_read: bool
    
    created_at: datetime
    
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

class FCMToken(BaseModel):
    token: str
    user_id: str
    device_id: Optional[str] = None

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None