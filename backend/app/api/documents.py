import json
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.document import Document, VerificationStatus
from app.models.request import Request
from app.schemas.request import DocumentOut
from app.services.deps import get_current_user
from app.services.documents.extractor import analyze_document
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    request_id: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a supporting document for a request."""
    # Validate request exists
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Validate file type
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_UPLOAD_SIZE_MB}MB)")

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Analyze document
    analysis = await analyze_document(file_path, file.filename or filename, req.description)

    # Save to DB
    doc = Document(
        id=file_id,
        request_id=request_id,
        filename=filename,
        original_filename=file.filename or filename,
        document_type=analysis.get("document_type"),
        file_url=f"/uploads/{filename}",
        extracted_data=json.dumps(analysis),
        verification_status=VerificationStatus.VERIFIED,
    )
    db.add(doc)

    # Update request status
    from app.models.request import RequestStatus
    if req.status.value in ["SUBMITTED", "AI_CLASSIFIED"]:
        req.status = RequestStatus.DOCUMENT_VERIFIED
    db.commit()
    db.refresh(doc)

    return doc


@router.post("/analyze")
async def analyze_uploaded_document(
    request_id: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a document without saving it."""
    req = db.query(Request).filter(Request.id == request_id).first()
    context = req.description if req else None

    content = await file.read()
    _, ext = os.path.splitext(file.filename or "")

    # Save temp file for analysis
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{uuid.uuid4()}{ext}")
    with open(temp_path, "wb") as f:
        f.write(content)

    try:
        analysis = await analyze_document(temp_path, file.filename or "document", context)
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass

    return analysis


@router.get("/request/{request_id}", response_model=list[DocumentOut])
def get_request_documents(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for a request."""
    docs = db.query(Document).filter(Document.request_id == request_id).all()
    return docs
