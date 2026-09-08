from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import enum
import uuid


class StepStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("requests.id"), nullable=False)
    step_name = Column(String, nullable=False)
    step_order = Column(String, nullable=False)  # e.g. "1", "2", "3"
    status = Column(Enum(StepStatus), default=StepStatus.PENDING)
    assigned_to = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

    request = relationship("Request", back_populates="workflow_steps")
