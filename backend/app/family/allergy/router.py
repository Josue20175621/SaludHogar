from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import Allergy, FamilyMember
from app.schemas import AllergyOut, AllergyCreate, AllergyUpdate

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Allergies"]
)

# Obtener todas las alergias de un miembro
@router.get("/allergies", response_model=list[AllergyOut])
async def get_member_allergies(
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Allergy).where(Allergy.member_id == member.id)
    result = await db.execute(stmt)
    return result.scalars().all()

# Crear una nueva alergia
@router.post("/allergies", response_model=AllergyOut, status_code=status.HTTP_201_CREATED)
async def create_allergy(
    data: AllergyCreate,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    new_allergy = Allergy(
        family_id=member.family_id,
        member_id=member.id,
        name=data.name,
        category=data.category,
        reaction=data.reaction,
        is_severe=data.is_severe,
    )
    db.add(new_allergy)
    await db.commit()
    await db.refresh(new_allergy)
    return new_allergy

# Actualizar una alergia existente
@router.put("/allergies/{allergy_id}", response_model=AllergyOut)
async def update_allergy(
    allergy_id: int,
    data: AllergyUpdate,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Allergy).where(Allergy.id == allergy_id, Allergy.member_id == member.id)
    result = await db.execute(stmt)
    allergy = result.scalar_one_or_none()

    if not allergy:
        raise HTTPException(status_code=404, detail="Alergia no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(allergy, field, value)

    await db.commit()
    await db.refresh(allergy)
    return allergy

# Eliminar una alergia
@router.delete("/allergies/{allergy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allergy(
    allergy_id: int,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Allergy).where(Allergy.id == allergy_id, Allergy.member_id == member.id)
    result = await db.execute(stmt)
    allergy = result.scalar_one_or_none()

    if not allergy:
        raise HTTPException(status_code=404, detail="Alergia no encontrada")

    await db.delete(allergy)
    await db.commit()
