"""
Document Intelligence Service — CampusFlow AI

Extracts structured information from uploaded documents.
In demo mode, returns realistic mock extraction results.
Real OCR path (Tesseract) is wired in when available.
"""
import json
import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Mock extracted data templates for demo mode
MOCK_EXTRACTIONS = {
    "student_id": {
        "document_type": "Student ID Card",
        "fields": {
            "Name": "Rahul Teja",
            "Student ID": "STU2026001",
            "Department": "Computer Science & Engineering",
            "Semester": "6th",
            "Valid Until": "May 2027",
            "Institution": "National Institute of Technology"
        },
        "verification_checks": [
            "Document readable",
            "Required fields detected",
            "Student ID verified",
            "Document type: Student ID Card"
        ]
    },
    "fee_receipt": {
        "document_type": "Fee Payment Receipt",
        "fields": {
            "Student Name": "Rahul Teja",
            "Student ID": "STU2026001",
            "Transaction ID": "TXN20260215004821",
            "Amount": "₹85,000",
            "Payment Date": "15-Feb-2026",
            "Payment Mode": "Net Banking",
            "Semester": "Semester VI",
            "Payment Status": "SUCCESS"
        },
        "verification_checks": [
            "Document readable",
            "Transaction ID detected",
            "Amount verified: ₹85,000",
            "Document type: Fee Receipt"
        ]
    },
    "default": {
        "document_type": "Supporting Document",
        "fields": {
            "Document ID": "DOC-2026-AUTO",
            "Detected Content": "University document",
            "Verification": "Passed basic checks"
        },
        "verification_checks": [
            "Document readable",
            "Content detected",
            "Basic verification passed"
        ]
    }
}


def _detect_document_type(filename: str) -> str:
    """Heuristic document type detection from filename."""
    fn = filename.lower()
    if any(kw in fn for kw in ["id", "card", "student", "identity"]):
        return "student_id"
    elif any(kw in fn for kw in ["fee", "receipt", "payment", "challan"]):
        return "fee_receipt"
    elif any(kw in fn for kw in ["hostel", "room", "allot"]):
        return "hostel"
    return "default"


def _try_tesseract_ocr(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Attempt real OCR using Tesseract.
    Returns None if Tesseract is not available.
    """
    try:
        import pytesseract
        from PIL import Image
        import cv2
        import numpy as np

        # Load image
        if file_path.lower().endswith(".pdf"):
            logger.info("PDF OCR not implemented in prototype — using mock")
            return None

        # Preprocess with OpenCV
        img = cv2.imread(file_path)
        if img is None:
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

        # Run OCR
        text = pytesseract.image_to_string(gray)
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        return {
            "document_type": "Scanned Document",
            "fields": {"Raw Text": " | ".join(lines[:10])},
            "verification_checks": ["OCR completed", f"Lines extracted: {len(lines)}"],
            "raw_text": text,
        }
    except ImportError:
        return None
    except Exception as e:
        logger.warning(f"Tesseract OCR failed: {e}")
        return None


async def analyze_document(
    file_path: str,
    original_filename: str,
    request_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze an uploaded document and extract structured information.
    
    Priority:
    1. Try real Tesseract OCR
    2. Fall back to mock extraction (demo mode)
    """
    # Try real OCR first
    ocr_result = _try_tesseract_ocr(file_path)
    if ocr_result:
        return {
            "document_type": ocr_result["document_type"],
            "extracted_fields": ocr_result["fields"],
            "verification_checks": ocr_result["verification_checks"],
            "ocr_used": True,
            "confidence": 0.80,
        }

    # Fall back to mock extraction
    doc_type_key = _detect_document_type(original_filename)

    # If request context mentions fee-related, use fee template
    if request_context:
        ctx = request_context.lower()
        if any(kw in ctx for kw in ["fee", "payment", "receipt", "outstanding"]):
            doc_type_key = "fee_receipt"
        elif any(kw in ctx for kw in ["id", "certificate", "bonafide"]):
            doc_type_key = "student_id"

    mock = MOCK_EXTRACTIONS.get(doc_type_key, MOCK_EXTRACTIONS["default"])

    return {
        "document_type": mock["document_type"],
        "extracted_fields": mock["fields"],
        "verification_checks": mock["verification_checks"],
        "ocr_used": False,
        "confidence": 0.95,
        "demo_mode": True,
    }
