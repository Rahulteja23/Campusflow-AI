from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.request import Request, RequestStatus
from app.schemas.request import SLAStatus
from app.services.deps import get_current_user, require_admin
from app.services.sla.monitor import (
    calculate_sla_status, get_sla_breached_requests, get_sla_warning_requests
)

router = APIRouter(prefix="/api/sla", tags=["sla"])


@router.get("/{request_id}", response_model=SLAStatus)
def get_sla_status(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return calculate_sla_status(req)


@router.get("/breached/list")
def get_breached(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    requests = get_sla_breached_requests(db)
    return [calculate_sla_status(r).__dict__ for r in requests]


@router.get("/warnings/list")
def get_warnings(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    requests = get_sla_warning_requests(db)
    return [calculate_sla_status(r).__dict__ for r in requests]


@router.post("/check")
async def check_and_escalate(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Trigger SLA breach check and automatic escalation."""
    from app.services.workflow.mock_orchestrator import MockWorkflowOrchestrator
    
    breached = get_sla_breached_requests(db)
    escalated = []
    
    orchestrator = MockWorkflowOrchestrator(db)
    for req in breached:
        result = await orchestrator.escalate_case(
            req.id,
            f"SLA breached by {calculate_sla_status(req).percentage_elapsed:.1f}%",
            f"{req.department} Manager"
        )
        escalated.append({
            "request_number": req.request_number,
            "department": req.department,
            "result": result
        })

    return {
        "escalated_count": len(escalated),
        "escalated": escalated,
        "warning_count": len(get_sla_warning_requests(db))
    }
