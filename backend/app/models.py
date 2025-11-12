from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import ForeignKey, String, TIMESTAMP, func, Date, Boolean, Text, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from app.security import encryption


class Base(DeclarativeBase):
    """Common declarative base for the whole model hierarchy."""

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    is_totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    memberships: Mapped[List["FamilyMembership"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    owned_family: Mapped[Optional["Family"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan", # i don't know, what if we want to transfer ownership to other family members
        passive_deletes=True,
        uselist=False
    )

    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} first_name={self.first_name!r} last_name={self.last_name!r}>"


class Family(Base):
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships 
    owner: Mapped[User] = relationship(back_populates="owned_family")

    memberships: Mapped[List["FamilyMembership"]] = relationship(
        back_populates="family", 
        cascade="all, delete-orphan"
    )

    members: Mapped[List["FamilyMember"]] = relationship(
        back_populates="family",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="FamilyMember.id"
    )

    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    medications: Mapped[List["Medication"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    vaccinations: Mapped[List["Vaccination"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    allergies: Mapped[List["Allergy"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    conditions: Mapped[List["Condition"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    surgeries: Mapped[List["Surgery"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    hospitalizations: Mapped[List["Hospitalization"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )
    family_history: Mapped[List["FamilyHistoryCondition"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )

    encryption_key: Mapped[Optional["FamilyEncryptionKey"]] = relationship(
        back_populates="family", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Family id={self.id} name={self.name!r}>"

class FamilyMembership(Base):
    __tablename__ = "family_memberships"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), primary_key=True)

    role: Mapped[str] = mapped_column(String(50), default='member', nullable=False)

    # Relationships 
    user: Mapped["User"] = relationship(back_populates="memberships")
    family: Mapped["Family"] = relationship(back_populates="memberships")

    def __repr__(self) -> str:
        return f"<FamilyMembership user_id={self.user_id} family_id={self.family_id} role='{self.role}'>"

class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)

    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )

    first_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    relation: Mapped[Optional[str]] = mapped_column(String(50), nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date)

    profile_image_relpath: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    blood_type: Mapped[Optional[str]] = mapped_column(String(5))
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    tobacco_use: Mapped[Optional[str]] = mapped_column(String(100))
    alcohol_use: Mapped[Optional[str]] = mapped_column(String(100))
    occupation: Mapped[Optional[str]] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    family: Mapped[Family] = relationship(back_populates="members")

    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    medications: Mapped[List["Medication"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    vaccinations: Mapped[List["Vaccination"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    allergies: Mapped[List["Allergy"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    
    conditions: Mapped[List["Condition"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    surgeries: Mapped[List["Surgery"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    hospitalizations: Mapped[List["Hospitalization"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FamilyMember id={self.id} first_name={self.first_name!r} last_name={self.last_name!r}>"

class FamilyHistoryCondition(Base):
    __tablename__ = "family_history_conditions"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)

    condition_name: Mapped[str] = mapped_column(String(255), nullable=False)
    relative: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    
    
    family: Mapped["Family"] = relationship(back_populates="family_history")

class Hospitalization(Base):
    __tablename__ = "hospitalizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)

    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    discharge_date: Mapped[Optional[date]] = mapped_column(Date)
    
    facility_name: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # --- Relationships ---
    family: Mapped["Family"] = relationship(back_populates="hospitalizations")
    member: Mapped["FamilyMember"] = relationship(back_populates="hospitalizations")

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)

    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)

    appointment_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    doctor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    is_reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default='f')
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="appointments")
    member: Mapped["FamilyMember"] = relationship(back_populates="appointments")

    def __repr__(self) -> str:
        return f"<Appointment id={self.id} doctor='{self.doctor_name}' date='{self.appointment_date}'>"

class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)

    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)

    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    prescribed_by: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="medications")
    member: Mapped["FamilyMember"] = relationship(back_populates="medications")

    def __repr__(self) -> str:
        return f"<Medication id={self.id} name='{self.name}' member_id={self.member_id}>"

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id: Mapped[int] = mapped_column(primary_key=True)

    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
    )

    vaccine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_administered: Mapped[date] = mapped_column(Date, nullable=False)
    administered_by: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="vaccinations")
    member: Mapped["FamilyMember"] = relationship(back_populates="vaccinations")

    def __repr__(self) -> str:
        return f"<Vaccination id={self.id} name='{self.vaccine_name}' member_id={self.member_id}>"

class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    reaction: Mapped[Optional[str]] = mapped_column(Text)
    is_severe: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    family: Mapped["Family"] = relationship(back_populates="allergies")
    member: Mapped["FamilyMember"] = relationship(back_populates="allergies")

class Condition(Base):
    __tablename__ = "conditions"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_diagnosed: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="conditions")
    member: Mapped["FamilyMember"] = relationship(back_populates="conditions")

class Surgery(Base):
    __tablename__ = "surgeries"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_procedure: Mapped[date] = mapped_column(Date, nullable=False)
    surgeon_name: Mapped[Optional[str]] = mapped_column(String(255))
    facility_name: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="surgeries")
    member: Mapped["FamilyMember"] = relationship(back_populates="surgeries")

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    related_entity_type: Mapped[Optional[str]] = mapped_column(String(100))
    related_entity_id: Mapped[Optional[int]] = mapped_column(Integer)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")

class FamilyEncryptionKey(Base):
    __tablename__ = 'family_encryption_keys'

    id: Mapped[int] = mapped_column(primary_key=True)
    
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id', ondelete="CASCADE"), unique=True, nullable=False)
    
    encrypted_dek: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="encryption_key")