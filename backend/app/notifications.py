from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
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
    if not notification or notification.user_id != user.id:
        raise HTTPException(404, "No encontre notificacion")
    
    notification.is_read = True
    await db.commit()
    return None