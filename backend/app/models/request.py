from sqlalchemy import Column, String, DateTime, Float, Integer, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import enum
import uuid


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RequestStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    AI_CLASSIFIED = "AI_CLASSIFIED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    ROUTED = "ROUTED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"


class Department(str, enum.Enum):
    ACADEMIC = "Academic Administration"
    FINANCE = "Finance"
    HOSTEL = "Hostel Administration"
    EXAMINATION = "Examination"
    PLACEMENT = "Placement"


class Request(Base):
    __tablename__ = "requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_number = Column(String, unique=True, nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    intent = Column(String, nullable=True)
    category = Column(String, nullable=True)
    department = Column(String, nullable=True)
    priority = Column(Enum(Priority), nullable=True)
    urgency_score = Column(Float, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.SUBMITTED)
    sla_hours = Column(Integer, nullable=True)
    sla_deadline = Column(DateTime, nullable=True)
    assigned_officer = Column(String, ForeignKey("users.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)  # JSON string of AI result
    required_documents = Column(Text, nullable=True)  # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="requests", foreign_keys=[student_id])
    officer = relationship("User", foreign_keys=[assigned_officer])
    documents = relationship("Document", back_populates="request")
    workflow_steps = relationship("WorkflowStep", back_populates="request")
    notifications = relationship("Notification", back_populates="request")
    audit_logs = relationship("AuditLog", back_populates="request")
