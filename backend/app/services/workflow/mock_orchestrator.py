"""
Mock Workflow Orchestrator — CampusFlow AI

Simulates NewgenONE BPM orchestration locally.
This is a PROTOTYPE implementation for demo purposes only.

NOTE: This is NOT connected to a live NewgenONE environment.
To integrate with real NewgenONE, implement NewgenWorkflowOrchestrator
using the WorkflowOrchestrator interface and configure credentials in .env.
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.services.workflow.orchestrator import WorkflowOrchestrator, WORKFLOW_TEMPLATES
from app.models.workflow import WorkflowStep, StepStatus
from app.models.request import Request, RequestStatus
from app.models.audit import AuditLog
from app.models.notification import Notification


class MockWorkflowOrchestrator(WorkflowOrchestrator):
    """
    Mock implementation of WorkflowOrchestrator for demo/prototype use.
    Simulates what NewgenONE would do in a production environment.
    
    To replace with real NewgenONE:
    - Implement NewgenWorkflowOrchestrator(WorkflowOrchestrator)
    - Use httpx to call NEWGEN_API_URL endpoints
    - Map CampusFlow request data to NewgenONE case payload format
    """

    def __init__(self, db: Session):
        self.db = db

    async def create_case(self, request_id: str, category: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        case_id = f"CASE-{str(uuid.uuid4())[:8].upper()}"
        self._audit(request_id, "AI_SYSTEM", "AI System", "Case Created", None, "SUBMITTED",
                    f"Workflow case {case_id} created for category: {category}")
        return {"case_id": case_id, "status": "CREATED", "category": category}

    async def route_case(self, request_id: str, department: str, priority: str) -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        if request:
            old_status = request.status.value if request.status else None
            request.status = RequestStatus.ROUTED
            self.db.commit()
            self._audit(request_id, "SYSTEM", "System", "Request Routed",
                        old_status, "ROUTED", f"Routed to {department} with priority {priority}")
            self._notify_student(request_id, request.student_id,
                                 "Request Routed",
                                 f"Your request has been routed to {department}.",
                                 "ROUTED")
        return {"routed_to": department, "priority": priority, "status": "ROUTED"}

    async def start_workflow(self, request_id: str, workflow_type: str) -> List[Dict[str, Any]]:
        """
        Creates workflow steps in the database based on the workflow template.
        In production, NewgenONE would manage these steps via its BPM engine.
        """
        template = WORKFLOW_TEMPLATES.get(workflow_type, WORKFLOW_TEMPLATES["General"])

        # Remove any existing steps
        self.db.query(WorkflowStep).filter(WorkflowStep.request_id == request_id).delete()

        now = datetime.utcnow()
        steps = []
        for i, step_def in enumerate(template):
            step = WorkflowStep(
                id=str(uuid.uuid4()),
                request_id=request_id,
                step_name=step_def["step_name"],
                step_order=step_def["step_order"],
                status=StepStatus.COMPLETED if i < 2 else (
                    StepStatus.IN_PROGRESS if i == 2 else StepStatus.PENDING
                ),
                started_at=now if i <= 2 else None,
                completed_at=now if i < 2 else None,
            )
            self.db.add(step)
            steps.append(step)

        self.db.commit()
        self._audit(request_id, "SYSTEM", "System", "Workflow Started", "ROUTED", "IN_PROGRESS",
                    f"Workflow type: {workflow_type}")
        return [{"step_name": s.step_name, "status": s.status.value} for s in steps]

    async def approve_step(self, request_id: str, step_id: str, officer_id: str, comments: str = "") -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        if not request:
            return {"error": "Request not found"}

        # Find current in-progress step
        current_step = self.db.query(WorkflowStep).filter(
            WorkflowStep.request_id == request_id,
            WorkflowStep.status == StepStatus.IN_PROGRESS
        ).first()

        if current_step:
            current_step.status = StepStatus.COMPLETED
            current_step.completed_at = datetime.utcnow()
            current_step.comments = comments

            # Move next step to in-progress
            next_step = self.db.query(WorkflowStep).filter(
                WorkflowStep.request_id == request_id,
                WorkflowStep.status == StepStatus.PENDING
            ).order_by(WorkflowStep.step_order).first()

            if next_step:
                next_step.status = StepStatus.IN_PROGRESS
                next_step.started_at = datetime.utcnow()

        old_status = request.status.value if request.status else None
        request.status = RequestStatus.APPROVED
        self.db.commit()

        self._audit(request_id, officer_id, "Officer", "Step Approved",
                    old_status, "APPROVED", comments)
        self._notify_student(request_id, request.student_id, "Request Approved",
                             "Your request has been approved and is being processed.", "APPROVED")

        return {"status": "APPROVED", "comments": comments}

    async def reject_step(self, request_id: str, step_id: str, officer_id: str, reason: str) -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        if not request:
            return {"error": "Request not found"}

        old_status = request.status.value if request.status else None
        request.status = RequestStatus.REJECTED
        self.db.commit()

        self._audit(request_id, officer_id, "Officer", "Request Rejected",
                    old_status, "REJECTED", reason)
        self._notify_student(request_id, request.student_id, "Request Rejected",
                             f"Your request was rejected. Reason: {reason}", "REJECTED")

        return {"status": "REJECTED", "reason": reason}

    async def escalate_case(self, request_id: str, reason: str, escalated_to: str) -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        if not request:
            return {"error": "Request not found"}

        old_status = request.status.value if request.status else None
        request.status = RequestStatus.ESCALATED
        self.db.commit()

        self._audit(request_id, None, "SYSTEM", "Automatic SLA Escalation",
                    old_status, "ESCALATED",
                    f"Reason: {reason}. Escalated to: {escalated_to}")
        self._notify_student(request_id, request.student_id, "Request Escalated",
                             f"Your request has been escalated to {escalated_to} due to SLA breach.", "ESCALATED")

        return {"status": "ESCALATED", "escalated_to": escalated_to, "reason": reason}

    async def complete_case(self, request_id: str, resolution: str) -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        if not request:
            return {"error": "Request not found"}

        old_status = request.status.value if request.status else None
        request.status = RequestStatus.RESOLVED
        request.resolution = resolution
        request.resolved_at = datetime.utcnow()

        # Complete all remaining steps
        pending_steps = self.db.query(WorkflowStep).filter(
            WorkflowStep.request_id == request_id,
            WorkflowStep.status.in_([StepStatus.IN_PROGRESS, StepStatus.PENDING])
        ).all()
        for step in pending_steps:
            step.status = StepStatus.COMPLETED
            step.completed_at = datetime.utcnow()

        self.db.commit()

        self._audit(request_id, None, "SYSTEM", "Request Resolved",
                    old_status, "RESOLVED", resolution)
        self._notify_student(request_id, request.student_id, "Request Resolved",
                             f"Your request has been resolved. {resolution}", "RESOLVED")

        return {"status": "RESOLVED", "resolution": resolution}

    async def get_workflow_status(self, request_id: str) -> Dict[str, Any]:
        request = self.db.query(Request).filter(Request.id == request_id).first()
        steps = self.db.query(WorkflowStep).filter(
            WorkflowStep.request_id == request_id
        ).order_by(WorkflowStep.step_order).all()

        return {
            "request_id": request_id,
            "status": request.status.value if request else "UNKNOWN",
            "steps": [
                {
                    "id": s.id,
                    "step_name": s.step_name,
                    "step_order": s.step_order,
                    "status": s.status.value,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                    "comments": s.comments,
                }
                for s in steps
            ]
        }

    def _audit(self, request_id, actor_id, actor_name, action, old_status, new_status, comments=""):
        log = AuditLog(
            id=str(uuid.uuid4()),
            request_id=request_id,
            actor_id=actor_id if isinstance(actor_id, str) and len(actor_id) > 10 else None,
            actor_type=actor_name.upper().replace(" ", "_"),
            actor_name=actor_name,
            action=action,
            old_status=old_status,
            new_status=new_status,
            comments=comments,
        )
        self.db.add(log)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

    def _notify_student(self, request_id, student_id, title, message, notification_type):
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=student_id,
            request_id=request_id,
            title=title,
            message=message,
            notification_type=notification_type,
            read=False,
        )
        self.db.add(notif)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
