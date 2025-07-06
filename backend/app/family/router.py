from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas import FamilyForm, FamilyMemberForm, FamilyOut, FamilyMemberOut
from app.models import User, Family, FamilyMember
from app.database import get_db
from .dependencies import get_current_user_family
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/family", tags=["Family"])

@router.post("", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
async def create_family(
    form: FamilyForm,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create the family for the current user. This can only be done once."""
    family = Family(name=form.name, owner_id=user.id)
    db.add(family)
    try:
        await db.commit()
    except IntegrityError: # This is triggered by the `unique=True` constraint
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A family already exists for this user."
        )
    await db.refresh(family, ["members"])
    return family

@router.get("", response_model=FamilyOut)
async def get_family(family: Family = Depends(get_current_user_family)):
    """Get the current user's family details."""
    return family

@router.patch("", response_model=FamilyOut)
async def update_family(
    form: FamilyForm,
    family: Family = Depends(get_current_user_family),
    db: AsyncSession = Depends(get_db)
):
    """Update the name of the current user's family."""
    family.name = form.name
    await db.commit()
    await db.refresh(family, ["members"])
    return family

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family(
    family: Family = Depends(get_current_user_family),
    db: AsyncSession = Depends(get_db)
):
    await db.delete(family)
    await db.commit()

# Family member CRUD
@router.get("/members", response_model=list[FamilyMemberOut])
async def list_members(family: Family = Depends(get_current_user_family)):
    # The dependency already eager loaded the members for us!
    return family.members

@router.post("/members", response_model=FamilyMemberOut, status_code=status.HTTP_201_CREATED)
async def add_member(member: FamilyMemberForm, family: Family = Depends(get_current_user_family), db: AsyncSession = Depends(get_db)):
    m = FamilyMember(**member.model_dump(), family_id=family.id)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m

@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: int,
    family: Family = Depends(get_current_user_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FamilyMember).join(Family).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )
    member = (await db.execute(stmt)).scalar_one_or_none()

    if member is None: raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.commit()

@router.patch("/members/{member_id}", response_model=FamilyMemberOut)
async def update_member(
    member_id: int,
    data: FamilyMemberForm,
    family: Family = Depends(get_current_user_family),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FamilyMember).join(Family).where(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family.id
    )
    member = (await db.execute(stmt)).scalar_one_or_none()

    if member is None: raise HTTPException(status_code=404, detail="Member not found or not authorized")

    # Get a dict of only the fields that were sent in the request
    update_data = data.model_dump(exclude_unset=True)

    # Update the member model with the new data
    for key, value in update_data.items():
        setattr(member, key, value)
    
    await db.commit()
    await db.refresh(member)
    return member