from datetime import datetime, date
from typing import List, Optional, ClassVar

from sqlalchemy import ForeignKey, String, TIMESTAMP, func, Date, Boolean, Text, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.security import encryption


class Base(DeclarativeBase):
    """Common declarative base for the whole model hierarchy."""

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    is_totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    _first_name_encrypted: Mapped[str] = mapped_column("first_name", Text, nullable=False)
    _last_name_encrypted: Mapped[str] = mapped_column("last_name", Text, nullable=False)

    @hybrid_property
    def first_name(self) -> str:
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for decryption on User")
        return encryption.decrypt_with_dek(self._first_name_encrypted, self._plaintext_dek)

    @first_name.setter
    def first_name(self, value: str):
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for encryption on User")
        self._first_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def last_name(self) -> str:
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for decryption on User")
        return encryption.decrypt_with_dek(self._last_name_encrypted, self._plaintext_dek)

    @last_name.setter
    def last_name(self, value: str):
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for encryption on User")
        self._last_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

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


class Family(Base):
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    _name_encrypted: Mapped[str] = mapped_column("name", Text, nullable=False)
    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def name(self) -> str:
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for decryption on Family")
        return encryption.decrypt_with_dek(self._name_encrypted, self._plaintext_dek)

    @name.setter
    def name(self, value: str):
        if self._plaintext_dek is None:
            raise RuntimeError("DEK not loaded for encryption on Family")
        self._name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

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

class FamilyMembership(Base):
    __tablename__ = "family_memberships"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), primary_key=True)

    role: Mapped[str] = mapped_column(String(50), default='member', nullable=False)

    # Relationships 
    user: Mapped["User"] = relationship(back_populates="memberships")
    family: Mapped["Family"] = relationship(back_populates="memberships")

class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    birth_date: Mapped[Optional[date]] = mapped_column(Date)
    profile_image_relpath: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    _first_name_encrypted: Mapped[str] = mapped_column("first_name", Text, nullable=False)
    _last_name_encrypted: Mapped[str] = mapped_column("last_name", Text, nullable=False)
    _relation_encrypted: Mapped[str] = mapped_column("relation", Text, nullable=False)
    _blood_type_encrypted: Mapped[Optional[str]] = mapped_column("blood_type", Text)
    _phone_number_encrypted: Mapped[Optional[str]] = mapped_column("phone_number", Text)
    _tobacco_use_encrypted: Mapped[Optional[str]] = mapped_column("tobacco_use", Text)
    _alcohol_use_encrypted: Mapped[Optional[str]] = mapped_column("alcohol_use", Text)
    _occupation_encrypted: Mapped[Optional[str]] = mapped_column("occupation", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def first_name(self) -> str: # type: ignore
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._first_name_encrypted, self._plaintext_dek)

    @first_name.setter
    def first_name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        self._first_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)
    
    @hybrid_property
    def last_name(self) -> str: # type: ignore
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._last_name_encrypted, self._plaintext_dek)
    
    @last_name.setter
    def last_name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        self._last_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def relation(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._relation_encrypted, self._plaintext_dek)

    @relation.setter
    def relation(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        self._relation_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)
    

    @hybrid_property
    def blood_type(self) -> Optional[str]:
        if self._blood_type_encrypted is None:
            return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._blood_type_encrypted, self._plaintext_dek)

    @blood_type.setter
    def blood_type(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        if value is None:
            self._blood_type_encrypted = None
        else:
            self._blood_type_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def phone_number(self) -> Optional[str]: # type: ignore
        if self._phone_number_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._phone_number_encrypted, self._plaintext_dek)
    
    @phone_number.setter
    def phone_number(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        if value is None:
            self._phone_number_encrypted = None
        else:
            self._phone_number_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)
    
    @hybrid_property
    def tobacco_use(self) -> Optional[str]:
        if self._tobacco_use_encrypted is None:
            return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._tobacco_use_encrypted, self._plaintext_dek)

    @tobacco_use.setter
    def tobacco_use(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        if value is None:
            self._tobacco_use_encrypted = None
        else:
            self._tobacco_use_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def alcohol_use(self) -> Optional[str]:
        if self._alcohol_use_encrypted is None:
            return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._alcohol_use_encrypted, self._plaintext_dek)

    @alcohol_use.setter
    def alcohol_use(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        if value is None:
            self._alcohol_use_encrypted = None
        else:
            self._alcohol_use_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def occupation(self) -> Optional[str]:
        if self._occupation_encrypted is None:
            return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyMember")
        return encryption.decrypt_with_dek(self._occupation_encrypted, self._plaintext_dek)

    @occupation.setter
    def occupation(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyMember")
        if value is None:
            self._occupation_encrypted = None
        else:
            self._occupation_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)


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

class FamilyHistoryCondition(Base):
    __tablename__ = "family_history_conditions"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    _condition_name_encrypted: Mapped[str] = mapped_column("condition_name", Text, nullable=False)
    _relative_encrypted: Mapped[str] = mapped_column("relative", Text, nullable=False)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def condition_name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyHistoryCondition")
        return encryption.decrypt_with_dek(self._condition_name_encrypted, self._plaintext_dek)

    @condition_name.setter
    def condition_name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyHistoryCondition")
        self._condition_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def relative(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyHistoryCondition")
        return encryption.decrypt_with_dek(self._relative_encrypted, self._plaintext_dek)

    @relative.setter
    def relative(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyHistoryCondition")
        self._relative_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None:
            return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on FamilyHistoryCondition")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on FamilyHistoryCondition")
        if value is None:
            self._notes_encrypted = None
        else:
            self._notes_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    family: Mapped["Family"] = relationship(back_populates="family_history")

class Hospitalization(Base):
    __tablename__ = "hospitalizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    discharge_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    _reason_encrypted: Mapped[str] = mapped_column("reason", Text, nullable=False)
    _facility_name_encrypted: Mapped[Optional[str]] = mapped_column("facility_name", Text)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def reason(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Hospitalization")
        return encryption.decrypt_with_dek(self._reason_encrypted, self._plaintext_dek)

    @reason.setter
    def reason(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Hospitalization")
        self._reason_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def facility_name(self) -> Optional[str]:
        if self._facility_name_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Hospitalization")
        return encryption.decrypt_with_dek(self._facility_name_encrypted, self._plaintext_dek)

    @facility_name.setter
    def facility_name(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Hospitalization")
        if value is None:
            self._facility_name_encrypted = None
        else:
            self._facility_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Hospitalization")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Hospitalization")
        if value is None:
            self._notes_encrypted = None
        else:
            self._notes_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)
    
    # --- Relationships ---
    family: Mapped["Family"] = relationship(back_populates="hospitalizations")
    member: Mapped["FamilyMember"] = relationship(back_populates="hospitalizations")

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    appointment_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    is_reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default='f')
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    _doctor_name_encrypted: Mapped[str] = mapped_column("doctor_name", Text, nullable=False)
    _specialty_encrypted: Mapped[Optional[str]] = mapped_column("specialty", Text)
    _location_encrypted: Mapped[Optional[str]] = mapped_column("location", Text)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)
    
    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def doctor_name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Appointment")
        return encryption.decrypt_with_dek(self._doctor_name_encrypted, self._plaintext_dek)

    @doctor_name.setter
    def doctor_name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Appointment")
        self._doctor_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def specialty(self) -> Optional[str]:
        if self._specialty_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Appointment")
        return encryption.decrypt_with_dek(self._specialty_encrypted, self._plaintext_dek)

    @specialty.setter
    def specialty(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Appointment")
        self._specialty_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def location(self) -> Optional[str]:
        if self._location_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Appointment")
        return encryption.decrypt_with_dek(self._location_encrypted, self._plaintext_dek)

    @location.setter
    def location(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Appointment")
        self._location_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Appointment")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Appointment")
        self._notes_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="appointments")
    member: Mapped["FamilyMember"] = relationship(back_populates="appointments")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    _name_encrypted: Mapped[str] = mapped_column("name", Text, nullable=False)
    _dosage_encrypted: Mapped[str] = mapped_column("dosage", Text, nullable=False)
    _frequency_encrypted: Mapped[str] = mapped_column("frequency", Text, nullable=False)
    _prescribed_by_encrypted: Mapped[Optional[str]] = mapped_column("prescribed_by", Text)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Medication")
        return encryption.decrypt_with_dek(self._name_encrypted, self._plaintext_dek)

    @name.setter
    def name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Medication")
        self._name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def dosage(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Medication")
        return encryption.decrypt_with_dek(self._dosage_encrypted, self._plaintext_dek)

    @dosage.setter
    def dosage(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Medication")
        self._dosage_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def frequency(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Medication")
        return encryption.decrypt_with_dek(self._frequency_encrypted, self._plaintext_dek)

    @frequency.setter
    def frequency(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Medication")
        self._frequency_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def prescribed_by(self) -> Optional[str]:
        if self._prescribed_by_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Medication")
        return encryption.decrypt_with_dek(self._prescribed_by_encrypted, self._plaintext_dek)

    @prescribed_by.setter
    def prescribed_by(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Medication")
        self._prescribed_by_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Medication")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Medication")
        self._notes_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="medications")
    member: Mapped["FamilyMember"] = relationship(back_populates="medications")

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
    )
    date_administered: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    _vaccine_name_encrypted: Mapped[str] = mapped_column("vaccine_name", Text, nullable=False)
    _administered_by_encrypted: Mapped[Optional[str]] = mapped_column("administered_by", Text)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def vaccine_name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Vaccination")
        return encryption.decrypt_with_dek(self._vaccine_name_encrypted, self._plaintext_dek)

    @vaccine_name.setter
    def vaccine_name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Vaccination")
        self._vaccine_name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def administered_by(self) -> Optional[str]:
        if self._administered_by_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Vaccination")
        return encryption.decrypt_with_dek(self._administered_by_encrypted, self._plaintext_dek)

    @administered_by.setter
    def administered_by(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Vaccination")
        self._administered_by_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Vaccination")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Vaccination")
        self._notes_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="vaccinations")
    member: Mapped["FamilyMember"] = relationship(back_populates="vaccinations")

class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    is_severe: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    _category_encrypted: Mapped[str] = mapped_column("category", Text, nullable=False)
    _name_encrypted: Mapped[str] = mapped_column("name", Text, nullable=False)
    _reaction_encrypted: Mapped[Optional[str]] = mapped_column("reaction", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def category(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Allergy")
        return encryption.decrypt_with_dek(self._category_encrypted, self._plaintext_dek)

    @category.setter
    def category(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Allergy")
        self._category_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Allergy")
        return encryption.decrypt_with_dek(self._name_encrypted, self._plaintext_dek)

    @name.setter
    def name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Allergy")
        self._name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def reaction(self) -> Optional[str]:
        if self._reaction_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Allergy")
        return encryption.decrypt_with_dek(self._reaction_encrypted, self._plaintext_dek)

    @reaction.setter
    def reaction(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Allergy")
        self._reaction_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)
    
    # Relationships
    family: Mapped["Family"] = relationship(back_populates="allergies")
    member: Mapped["FamilyMember"] = relationship(back_populates="allergies")

class Condition(Base):
    __tablename__ = "conditions"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    date_diagnosed: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    _name_encrypted: Mapped[str] = mapped_column("name", Text, nullable=False)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)
    
    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Condition")
        return encryption.decrypt_with_dek(self._name_encrypted, self._plaintext_dek)

    @name.setter
    def name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Condition")
        self._name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Condition")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Condition")
        self._notes_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="conditions")
    member: Mapped["FamilyMember"] = relationship(back_populates="conditions")

class Surgery(Base):
    __tablename__ = "surgeries"

    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False)
    date_of_procedure: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    _name_encrypted: Mapped[str] = mapped_column("name", Text, nullable=False)
    _surgeon_name_encrypted: Mapped[Optional[str]] = mapped_column("surgeon_name", Text)
    _facility_name_encrypted: Mapped[Optional[str]] = mapped_column("facility_name", Text)
    _notes_encrypted: Mapped[Optional[str]] = mapped_column("notes", Text)

    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def name(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Surgery")
        return encryption.decrypt_with_dek(self._name_encrypted, self._plaintext_dek)

    @name.setter
    def name(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Surgery")
        self._name_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def surgeon_name(self) -> Optional[str]:
        if self._surgeon_name_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Surgery")
        return encryption.decrypt_with_dek(self._surgeon_name_encrypted, self._plaintext_dek)

    @surgeon_name.setter
    def surgeon_name(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Surgery")
        self._surgeon_name_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def facility_name(self) -> Optional[str]:
        if self._facility_name_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Surgery")
        return encryption.decrypt_with_dek(self._facility_name_encrypted, self._plaintext_dek)

    @facility_name.setter
    def facility_name(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Surgery")
        self._facility_name_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    @hybrid_property
    def notes(self) -> Optional[str]:
        if self._notes_encrypted is None: return None
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Surgery")
        return encryption.decrypt_with_dek(self._notes_encrypted, self._plaintext_dek)

    @notes.setter
    def notes(self, value: Optional[str]):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Surgery")
        self._notes_encrypted = None if value is None else encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="surgeries")
    member: Mapped["FamilyMember"] = relationship(back_populates="surgeries")

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(100))
    related_entity_id: Mapped[Optional[int]] = mapped_column(Integer)

    
    _message_encrypted: Mapped[str] = mapped_column("message", Text, nullable=False)
    _plaintext_dek: ClassVar[Optional[bytes]] = None

    @hybrid_property
    def message(self) -> str:
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for decryption on Notification")
        return encryption.decrypt_with_dek(self._message_encrypted, self._plaintext_dek)

    @message.setter
    def message(self, value: str):
        if self._plaintext_dek is None: raise RuntimeError("DEK not loaded for encryption on Notification")
        self._message_encrypted = encryption.encrypt_with_dek(value, self._plaintext_dek)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")

class FamilyEncryptionKey(Base):
    __tablename__ = 'family_encryption_keys'

    id: Mapped[int] = mapped_column(primary_key=True)
    
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id', ondelete="CASCADE"), unique=True, nullable=False)
    
    encrypted_dek: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="encryption_key")