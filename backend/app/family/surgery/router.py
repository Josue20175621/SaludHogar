from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.family.dependencies import get_target_member, get_hydrated_target_member
from app.models import Surgery, FamilyMember
from app.schemas import SurgeryCreate, SurgeryUpdate, SurgeryOut

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Surgeries"]
)


# Obtener todas las cirugías de un miembro
@router.get("/surgeries", response_model=list[SurgeryOut])
async def get_member_surgeries(
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Surgery).where(Surgery.member_id == member.id)
    result = await db.execute(stmt)
    surgeries = result.scalars().all()
    
    for surgery in surgeries:
        surgery._plaintext_dek = plaintext_dek
    
    return surgeries


# Crear una nueva cirugía
@router.post("/surgeries", response_model=SurgeryOut, status_code=status.HTTP_201_CREATED)
async def create_surgery(
    data: SurgeryCreate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    new_surgery = Surgery(
        family_id=member.family_id,
        member_id=member.id,
        date_of_procedure=data.date_of_procedure
    )
    new_surgery._plaintext_dek = plaintext_dek
    
    new_surgery.name = data.name
    new_surgery.surgeon_name = data.surgeon_name
    new_surgery.facility_name = data.facility_name
    new_surgery.notes = data.notes
    
    db.add(new_surgery)
    await db.commit()
    await db.refresh(new_surgery)
    
    new_surgery._plaintext_dek = plaintext_dek
    return new_surgery


# Actualizar una cirugía existente
@router.put("/surgeries/{surgery_id}", response_model=SurgeryOut)
async def update_surgery(
    surgery_id: int,
    data: SurgeryUpdate,
    member: FamilyMember = Depends(get_hydrated_target_member),
    db: AsyncSession = Depends(get_db)
):
    plaintext_dek = member._plaintext_dek

    stmt = select(Surgery).where(Surgery.id == surgery_id, Surgery.member_id == member.id)
    result = await db.execute(stmt)
    surgery = result.scalar_one_or_none()

    if not surgery:
        raise HTTPException(status_code=404, detail="Cirugia no encontrada")

    surgery._plaintext_dek = plaintext_dek
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(surgery, key, value)

    await db.commit()
    await db.refresh(surgery)
    
    surgery._plaintext_dek = plaintext_dek
    return surgery


# Eliminar una cirugía
@router.delete("/surgeries/{surgery_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_surgery(
    surgery_id: int,
    member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Surgery).where(Surgery.id == surgery_id, Surgery.member_id == member.id)
    result = await db.execute(stmt)
    surgery = result.scalar_one_or_none()

    if not surgery:
        raise HTTPException(status_code=404, detail="Cirugia no encontrada")

    await db.delete(surgery)
    await db.commit()
    return None
