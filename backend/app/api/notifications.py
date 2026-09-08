from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.schemas.request import NotificationOut, AuditLogOut
from app.services.deps import get_current_user, require_admin

router = APIRouter(tags=["notifications"])


@router.get("/api/notifications", response_model=List[NotificationOut])
def get_notifications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.patch("/api/notifications/{notif_id}/read")
def mark_read(
    notif_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    return {"ok": True}


@router.patch("/api/notifications/read-all")
def mark_all_read(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"ok": True}


@router.get("/api/audit", response_model=List[AuditLogOut])
def get_audit_logs(
    request_id: str = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if request_id:
        query = query.filter(AuditLog.request_id == request_id)
    return query.order_by(AuditLog.created_at.desc()).limit(200).all()


@router.get("/api/audit/request/{request_id}", response_model=List[AuditLogOut])
def get_request_audit(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).filter(
        AuditLog.request_id == request_id
    ).order_by(AuditLog.created_at.asc()).all()
