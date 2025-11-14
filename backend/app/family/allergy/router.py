from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.family.dependencies import get_target_member, get_hydrated_target_member
from app.models import Allergy, FamilyMember
from app.schemas import AllergyOut, AllergyCreate, AllergyUpdate

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Allergies"]
)

# Obtener todas las alergias de un miembro
@router.get("/allergies", response_model=list[AllergyOut])
async def get_member_allergies(
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Allergy).where(Allergy.member_id == member.id).order_by(Allergy.created_at.desc())
    result = await db.execute(stmt)
    allergies = result.scalars().all()

    for allergy in allergies:
        allergy._plaintext_dek = plaintext_dek
        
    return allergies

# Crear una nueva alergia
@router.post("/allergies", response_model=AllergyOut, status_code=status.HTTP_201_CREATED)
async def create_allergy(
    data: AllergyCreate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    new_allergy = Allergy(
        family_id=member.family_id,
        member_id=member.id,
        is_severe=data.is_severe
    )
    new_allergy._plaintext_dek = plaintext_dek
    
    new_allergy.name = data.name
    new_allergy.category = data.category
    new_allergy.reaction = data.reaction

    db.add(new_allergy)
    await db.commit()
    await db.refresh(new_allergy)
    
    new_allergy._plaintext_dek = plaintext_dek
    return new_allergy

# Actualizar una alergia existente
@router.put("/allergies/{allergy_id}", response_model=AllergyOut)
async def update_allergy(
    allergy_id: int,
    data: AllergyUpdate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Allergy).where(Allergy.id == allergy_id, Allergy.member_id == member.id)
    result = await db.execute(stmt)
    allergy = result.scalar_one_or_none()

    if not allergy: raise HTTPException(status_code=404, detail="Alergia no encontrada")

    allergy._plaintext_dek = plaintext_dek
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(allergy, field, value)

    await db.commit()
    await db.refresh(allergy)
    
    allergy._plaintext_dek = plaintext_dek
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
