from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import ForeignKey, String, TIMESTAMP, func, Date
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


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
        TIMESTAMP(timezone=False), server_default=func.now(), nullable=False
    )

    # One user can own many families
    owned_families: Mapped[List["Family"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # optional, but handy for debugging
        return f"<User id={self.id} first_name={self.first_name!r} last_name={self.last_name!r}>"


class Family(Base):
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now(), nullable=False
    )

    # --- relationships -----------------------------------------------------
    owner: Mapped[User] = relationship(back_populates="owned_families")

    members: Mapped[List["FamilyMember"]] = relationship(
        back_populates="family",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Family id={self.id} name={self.name!r}>"

class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)

    family_id: Mapped[int] = mapped_column(
        ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )

    first_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), unique=False, nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date)
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    relation: Mapped[Optional[str]] = mapped_column(String(50))
    blood_type: Mapped[str] = mapped_column(String(5))
    phone_number: Mapped[str] = mapped_column(String(20))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=False), server_default=func.now(), nullable=False
    )

    # --- relationships -----------------------------------------------------
    family: Mapped[Family] = relationship(back_populates="members")

    def __repr__(self) -> str:
        return f"<FamilyMember id={self.id} first_name={self.first_name!r} last_name={self.last_name!r}>"
