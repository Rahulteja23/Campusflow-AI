"""
Audit log API routes
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.audit import AuditLog
from app.models.request import Request
from app.services.deps import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/request/{request_id}")
def get_request_audit(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audit logs for a specific request."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.request_id == request_id)
        .order_by(AuditLog.created_at.asc())
        .all()
    )
    return [_log_to_dict(log) for log in logs]


@router.get("")
def get_all_audit_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all audit logs (admin only)."""
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(500)
        .all()
    )
    return [_log_to_dict(log) for log in logs]


def _log_to_dict(log: AuditLog) -> dict:
    return {
        "id": log.id,
        "request_id": log.request_id,
        "actor_id": log.actor_id,
        "actor_type": log.actor_type,
        "actor_name": log.actor_name,
        "action": log.action,
        "old_status": log.old_status,
        "new_status": log.new_status,
        "comments": log.comments,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }
