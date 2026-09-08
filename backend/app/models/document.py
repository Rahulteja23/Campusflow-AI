from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import enum
import uuid


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("requests.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    document_type = Column(String, nullable=True)
    file_url = Column(String, nullable=False)
    extracted_data = Column(Text, nullable=True)  # JSON string
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("Request", back_populates="documents")
