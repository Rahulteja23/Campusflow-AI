import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.request import Request, RequestStatus, Priority
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.request import RequestCreate, RequestOut, RequestUpdate, WorkflowActionRequest
from app.services.deps import get_current_user, require_student, require_officer, require_admin
from app.services.workflow.mock_orchestrator import MockWorkflowOrchestrator

router = APIRouter(prefix="/api/requests", tags=["requests"])


def _request_to_out(r: Request, db: Session) -> RequestOut:
    student = db.query(User).filter(User.id == r.student_id).first()
    officer = db.query(User).filter(User.id == r.assigned_officer).first() if r.assigned_officer else None
    out = RequestOut.model_validate(r)
    out.student_name = student.name if student else None
    out.officer_name = officer.name if officer else None
    return out


@router.post("", response_model=RequestOut)
async def create_request(
    payload: RequestCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Submit a new student request."""
    # Generate request number
    count = db.query(Request).count() + 1
    year = datetime.utcnow().year
    request_number = f"CF-{year}-{count:03d}"

    req = Request(
        id=str(uuid.uuid4()),
        request_number=request_number,
        student_id=current_user.id,
        description=payload.description,
        status=RequestStatus.SUBMITTED,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        request_id=req.id,
        actor_id=current_user.id,
        actor_type="STUDENT",
        actor_name=current_user.name,
        action="Request Submitted",
        old_status=None,
        new_status="SUBMITTED",
    )
    db.add(audit)
    db.commit()

    return _request_to_out(req, db)


@router.get("", response_model=List[RequestOut])
def list_requests(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List requests — filtered by role."""
    query = db.query(Request)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(Request.student_id == current_user.id)
    elif current_user.role == UserRole.OFFICER:
        query = query.filter(Request.assigned_officer == current_user.id)
    # ADMIN sees all

    if status:
        try:
            query = query.filter(Request.status == RequestStatus(status))
        except ValueError:
            pass
    if priority:
        try:
            query = query.filter(Request.priority == Priority(priority))
        except ValueError:
            pass
    if department:
        query = query.filter(Request.department == department)

    requests = query.order_by(Request.created_at.desc()).all()
    return [_request_to_out(r, db) for r in requests]


@router.get("/{request_id}", response_model=RequestOut)
def get_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Access control
    if current_user.role == UserRole.STUDENT and req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _request_to_out(req, db)


@router.patch("/{request_id}", response_model=RequestOut)
async def update_request(
    request_id: str,
    payload: RequestUpdate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Officer/Admin updates a request."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    old_status = req.status.value if req.status else None

    if payload.status:
        req.status = payload.status
    if payload.priority:
        req.priority = payload.priority
    if payload.assigned_officer:
        req.assigned_officer = payload.assigned_officer
    if payload.resolution:
        req.resolution = payload.resolution
        req.resolved_at = datetime.utcnow()

    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        request_id=req.id,
        actor_id=current_user.id,
        actor_type=current_user.role.value.upper(),
        actor_name=current_user.name,
        action="Request Updated",
        old_status=old_status,
        new_status=req.status.value,
        comments=payload.comments,
    )
    db.add(audit)
    db.commit()

    return _request_to_out(req, db)


@router.post("/{request_id}/classify")
async def classify_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger AI classification for a submitted request."""
    from app.services.ai.classifier import classify_request as ai_classify

    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    result = await ai_classify(req.description)

    req.intent = result.intent
    req.category = result.category
    req.department = result.department
    req.priority = Priority(result.priority)
    req.urgency_score = result.urgency_score
    req.sla_hours = result.sla_hours
    req.required_documents = json.dumps(result.required_documents)
    req.ai_analysis = result.model_dump_json()
    req.sla_deadline = datetime.utcnow() + timedelta(hours=result.sla_hours)
    req.status = RequestStatus.AI_CLASSIFIED
    req.updated_at = datetime.utcnow()
    db.commit()

    # Create workflow
    orchestrator = MockWorkflowOrchestrator(db)
    await orchestrator.create_case(req.id, result.category, result.model_dump())
    await orchestrator.route_case(req.id, result.department, result.priority)
    await orchestrator.start_workflow(req.id, result.category)

    # Assign to an available officer
    officer = db.query(User).filter(
        User.role == UserRole.OFFICER
    ).first()
    if officer:
        req.assigned_officer = officer.id
        req.status = RequestStatus.PENDING_APPROVAL
        db.commit()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        request_id=req.id,
        actor_id=None,
        actor_type="AI_SYSTEM",
        actor_name="AI System",
        action="Request AI Classified",
        old_status="SUBMITTED",
        new_status=req.status.value,
        comments=f"Intent: {result.intent}, Dept: {result.department}, Priority: {result.priority}",
    )
    db.add(audit)
    db.commit()

    return result


@router.post("/{request_id}/action")
async def workflow_action(
    request_id: str,
    payload: WorkflowActionRequest,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Perform a workflow action (approve, reject, resolve, escalate)."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    orchestrator = MockWorkflowOrchestrator(db)

    if payload.action == "approve":
        result = await orchestrator.approve_step(
            request_id, "", current_user.id, payload.comments or ""
        )
    elif payload.action == "reject":
        result = await orchestrator.reject_step(
            request_id, "", current_user.id, payload.comments or "No reason provided"
        )
    elif payload.action == "resolve":
        result = await orchestrator.complete_case(
            request_id, payload.comments or "Request resolved by officer"
        )
    elif payload.action == "escalate":
        result = await orchestrator.escalate_case(
            request_id,
            payload.comments or "Manual escalation by officer",
            "Department Head"
        )
    elif payload.action == "assign":
        if payload.assigned_officer_id:
            req.assigned_officer = payload.assigned_officer_id
            db.commit()
        result = {"status": "ASSIGNED"}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {payload.action}")

    db.refresh(req)
    return result
