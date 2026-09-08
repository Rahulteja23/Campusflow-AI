from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import uuid


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("requests.id"), nullable=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    actor_type = Column(String, nullable=False)  # "STUDENT", "OFFICER", "ADMIN", "AI_SYSTEM", "SYSTEM"
    actor_name = Column(String, nullable=True)
    action = Column(String, nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("Request", back_populates="audit_logs")
    actor = relationship("User", back_populates="audit_logs")
