from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import enum
import uuid


class UserRole(str, enum.Enum):
    STUDENT = "student"
    OFFICER = "officer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    student_id = Column(String, nullable=True)
    department = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    requests = relationship("Request", back_populates="student", foreign_keys="Request.student_id")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")
