"""
SLA Monitor — CampusFlow AI
Calculates SLA status and triggers escalation for breached requests.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.request import Request, RequestStatus
from app.schemas.request import SLAStatus


def calculate_sla_status(request: Request) -> SLAStatus:
    """Calculate current SLA status for a given request."""
    now = datetime.utcnow()

    if not request.sla_deadline:
        return SLAStatus(
            request_id=request.id,
            request_number=request.request_number,
            sla_hours=request.sla_hours or 48,
            sla_deadline=None,
            hours_remaining=None,
            minutes_remaining=None,
            percentage_elapsed=0.0,
            status="UNKNOWN",
            is_breached=False,
            is_warning=False,
        )

    total_seconds = request.sla_hours * 3600 if request.sla_hours else 48 * 3600
    elapsed_seconds = (now - request.created_at).total_seconds()
    remaining_seconds = (request.sla_deadline - now).total_seconds()

    percentage_elapsed = min((elapsed_seconds / total_seconds) * 100, 100) if total_seconds > 0 else 100

    is_breached = remaining_seconds <= 0
    is_warning = not is_breached and percentage_elapsed >= 75  # Warning at 75% elapsed

    if is_breached:
        status = "BREACHED"
    elif is_warning:
        status = "WARNING"
    else:
        status = "ON_TRACK"

    return SLAStatus(
        request_id=request.id,
        request_number=request.request_number,
        sla_hours=request.sla_hours or 48,
        sla_deadline=request.sla_deadline,
        hours_remaining=max(remaining_seconds / 3600, 0) if not is_breached else 0,
        minutes_remaining=max(remaining_seconds / 60, 0) if not is_breached else 0,
        percentage_elapsed=round(percentage_elapsed, 1),
        status=status,
        is_breached=is_breached,
        is_warning=is_warning,
    )


def get_sla_breached_requests(db: Session):
    """Get all active requests that have breached their SLA."""
    now = datetime.utcnow()
    return db.query(Request).filter(
        Request.sla_deadline < now,
        Request.status.not_in([
            RequestStatus.RESOLVED,
            RequestStatus.REJECTED,
            RequestStatus.ESCALATED,
        ])
    ).all()


def get_sla_warning_requests(db: Session):
    """Get all requests approaching their SLA deadline (within 25% time remaining)."""
    now = datetime.utcnow()
    all_active = db.query(Request).filter(
        Request.status.not_in([
            RequestStatus.RESOLVED,
            RequestStatus.REJECTED,
            RequestStatus.ESCALATED,
        ]),
        Request.sla_deadline.isnot(None),
        Request.sla_deadline > now,
    ).all()

    warnings = []
    for req in all_active:
        sla = calculate_sla_status(req)
        if sla.is_warning:
            warnings.append(req)
    return warnings
