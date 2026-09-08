from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.request import Priority, RequestStatus


class RequestCreate(BaseModel):
    description: str


class AIAnalysisRequest(BaseModel):
    description: str


class AIAnalysisResult(BaseModel):
    intent: str
    category: str
    department: str
    priority: str
    urgency_score: float
    sla_hours: int
    required_documents: List[str]
    required_action: str
    confidence: float = 0.9
    fallback_used: bool = False


class RequestOut(BaseModel):
    id: str
    request_number: str
    student_id: str
    description: str
    intent: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[Priority] = None
    urgency_score: Optional[float] = None
    status: RequestStatus
    sla_hours: Optional[int] = None
    sla_deadline: Optional[datetime] = None
    assigned_officer: Optional[str] = None
    resolution: Optional[str] = None
    ai_analysis: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    student_name: Optional[str] = None
    officer_name: Optional[str] = None

    class Config:
        from_attributes = True


class RequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    priority: Optional[Priority] = None
    assigned_officer: Optional[str] = None
    resolution: Optional[str] = None
    comments: Optional[str] = None


class WorkflowStepOut(BaseModel):
    id: str
    step_name: str
    step_order: str
    status: str
    assigned_to: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: str
    request_id: str
    filename: str
    original_filename: str
    document_type: Optional[str] = None
    file_url: str
    extracted_data: Optional[str] = None
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: str
    user_id: str
    request_id: Optional[str] = None
    title: str
    message: str
    notification_type: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: str
    request_id: Optional[str] = None
    actor_id: Optional[str] = None
    actor_type: str
    actor_name: Optional[str] = None
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SLAStatus(BaseModel):
    request_id: str
    request_number: str
    sla_hours: int
    sla_deadline: Optional[datetime]
    hours_remaining: Optional[float]
    minutes_remaining: Optional[float]
    percentage_elapsed: float
    status: str  # "ON_TRACK", "WARNING", "BREACHED"
    is_breached: bool
    is_warning: bool  # < 20% time remaining


class WorkflowActionRequest(BaseModel):
    action: str  # "approve", "reject", "resolve", "escalate", "request_info", "assign"
    comments: Optional[str] = None
    assigned_officer_id: Optional[str] = None
