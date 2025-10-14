from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete, update
from app.models import User, Notification
from app.schemas import NotificationOut
from app.auth.dependencies import get_current_user
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=list[NotificationOut])
async def get_my_notifications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Notification).where(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc())
    
    notifications = (await db.scalars(stmt)).all()
    return notifications

@router.post("/{notification_id}/mark-read", status_code=204)
async def mark_as_read(notification_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    notification = await db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id: raise HTTPException(404, "No encontré notificación")
    
    notification.is_read = True
    await db.commit()
    return None

@router.post("/mark-all-read", status_code=204)
async def mark_all_as_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == user.id,
            Notification.is_read == False
        )
        .values(is_read=True)
    )
    
    await db.execute(stmt)
    await db.commit()
    return None

@router.delete("/{notification_id}", status_code=204)
async def delete_notification(notification_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    notification = await db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id: raise HTTPException(404, "No encontré notificación")
    
    await db.delete(notification)
    await db.commit()
    return None

@router.post("/bulk-delete", status_code=204)
async def bulk_delete_notifications(
    notification_ids: list[int],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not notification_ids: raise HTTPException(400, "No se proporcionaron IDs de notificaciones")
    
    stmt = delete(Notification).where(
        Notification.id.in_(notification_ids),
        Notification.user_id == user.id
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    if result.rowcount == 0: raise HTTPException(404, "No se encontraron notificaciones para eliminar")
    
    return None

@router.post("/bulk-mark-read", status_code=204)
async def bulk_mark_as_read(
    notification_ids: list[int],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not notification_ids: raise HTTPException(400, "No se proporcionaron IDs de notificaciones")
    
    stmt = (
        update(Notification)
        .where(
            Notification.id.in_(notification_ids),
            Notification.user_id == user.id,
            Notification.is_read == False
        )
        .values(is_read=True)
    )
    
    await db.execute(stmt)
    await db.commit()
    return None

@router.get("/unread-count", response_model=dict)
async def get_unread_count(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == user.id,
        Notification.is_read == False
    )
    
    count = await db.scalar(stmt)
    return {"unread_count": count or 0}