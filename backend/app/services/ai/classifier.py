"""
AI Classification Service — CampusFlow AI

Uses Gemini API to classify student requests into structured decisions.
Falls back to a deterministic keyword-based classifier if API is unavailable.
"""
import json
import re
import logging
from typing import Optional
from app.config import settings
from app.schemas.request import AIAnalysisResult

logger = logging.getLogger(__name__)

# Deterministic fallback rules
FALLBACK_RULES = [
    {
        "keywords": ["bonafide", "certificate", "degree", "transcript", "academic record", "character certificate", "migration certificate"],
        "intent": "Certificate Request",
        "category": "Certificate",
        "department": "Academic Administration",
        "priority": "HIGH",
        "urgency_score": 0.75,
        "sla_hours": 24,
        "required_documents": ["Student ID", "Enrollment Proof"],
        "required_action": "Academic Officer Approval",
    },
    {
        "keywords": ["fee", "payment", "outstanding", "receipt", "refund", "challan", "scholarship fee", "tuition"],
        "intent": "Fee Issue Resolution",
        "category": "Finance",
        "department": "Finance",
        "priority": "MEDIUM",
        "urgency_score": 0.65,
        "sla_hours": 48,
        "required_documents": ["Fee Receipt", "Bank Statement"],
        "required_action": "Finance Officer Verification",
    },
    {
        "keywords": ["hostel", "room", "fan", "electricity", "water", "mess", "warden", "maintenance", "bed", "ac", "air conditioning", "bathroom"],
        "intent": "Hostel Maintenance Request",
        "category": "Hostel",
        "department": "Hostel Administration",
        "priority": "MEDIUM",
        "urgency_score": 0.60,
        "sla_hours": 24,
        "required_documents": ["Room Allotment Letter"],
        "required_action": "Maintenance Team Assignment",
    },
    {
        "keywords": ["exam", "examination", "result", "grade", "marks", "reevaluation", "hall ticket", "admit card", "backlog"],
        "intent": "Examination Query",
        "category": "Examination",
        "department": "Examination",
        "priority": "MEDIUM",
        "urgency_score": 0.70,
        "sla_hours": 48,
        "required_documents": ["Student ID", "Enrollment Number"],
        "required_action": "Examination Officer Review",
    },
    {
        "keywords": ["placement", "internship", "job", "company", "interview", "offer letter", "placement cell"],
        "intent": "Placement Assistance",
        "category": "Placement",
        "department": "Placement",
        "priority": "MEDIUM",
        "urgency_score": 0.55,
        "sla_hours": 72,
        "required_documents": ["Resume", "Student ID"],
        "required_action": "Placement Officer Review",
    },
]

URGENCY_KEYWORDS = {
    "urgent": 0.20,
    "immediately": 0.20,
    "asap": 0.20,
    "emergency": 0.25,
    "critical": 0.25,
    "tomorrow": 0.15,
    "today": 0.15,
    "deadline": 0.12,
    "exam": 0.10,
    "scholarship": 0.12,
    "interview": 0.10,
    "three days": 0.08,
    "last day": 0.15,
}


def _fallback_classify(description: str) -> AIAnalysisResult:
    text = description.lower()

    # Find best matching rule
    best_match = None
    best_score = 0

    for rule in FALLBACK_RULES:
        score = sum(1 for kw in rule["keywords"] if kw in text)
        if score > best_score:
            best_score = score
            best_match = rule

    if not best_match:
        # Default fallback
        best_match = {
            "intent": "General Enquiry",
            "category": "General",
            "department": "Academic Administration",
            "priority": "MEDIUM",
            "urgency_score": 0.50,
            "sla_hours": 48,
            "required_documents": ["Student ID"],
            "required_action": "Officer Review",
        }

    # Boost urgency based on urgency keywords
    urgency = best_match["urgency_score"]
    for kw, boost in URGENCY_KEYWORDS.items():
        if kw in text:
            urgency = min(urgency + boost, 0.99)

    # Escalate priority for very urgent requests
    priority = best_match["priority"]
    if urgency >= 0.85:
        priority = "HIGH"
    elif urgency >= 0.90:
        priority = "CRITICAL"

    return AIAnalysisResult(
        intent=best_match["intent"],
        category=best_match["category"],
        department=best_match["department"],
        priority=priority,
        urgency_score=round(urgency, 2),
        sla_hours=best_match["sla_hours"],
        required_documents=best_match["required_documents"],
        required_action=best_match["required_action"],
        confidence=0.75 if best_score > 0 else 0.50,
        fallback_used=True,
    )


async def classify_request(description: str) -> AIAnalysisResult:
    """
    Classify a student request using Gemini AI.
    Falls back to deterministic classifier if API is unavailable.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("No Gemini API key configured — using fallback classifier")
        return _fallback_classify(description)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are an AI classifier for CampusFlow AI, a university student service platform.

Analyze the following student request and return a structured JSON classification.

Student Request: "{description}"

You MUST return ONLY valid JSON, no other text. Use exactly this structure:
{{
  "intent": "<specific service name, e.g. Bonafide Certificate, Fee Payment Issue>",
  "category": "<one of: Certificate, Finance, Hostel, Examination, Placement, General>",
  "department": "<one of: Academic Administration, Finance, Hostel Administration, Examination, Placement>",
  "priority": "<one of: LOW, MEDIUM, HIGH, CRITICAL>",
  "urgency_score": <float 0.0 to 1.0>,
  "sla_hours": <integer: 24, 48, or 72>,
  "required_documents": ["<document1>", "<document2>"],
  "required_action": "<next step description>",
  "confidence": <float 0.0 to 1.0>
}}

Rules:
- HIGH priority if request is urgent, time-sensitive, or involves exams/scholarships
- CRITICAL priority if it involves safety or extreme urgency
- urgency_score between 0.0 and 1.0 reflecting how urgent the request is
- sla_hours: 24 for high priority, 48 for medium, 72 for low
- Only use the departments and categories listed above"""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Clean up markdown code blocks if present
        if "```json" in text:
            text = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
            text = text.group(1) if text else text
        elif "```" in text:
            text = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
            text = text.group(1) if text else text

        if isinstance(text, str):
            data = json.loads(text)
        else:
            data = {}

        return AIAnalysisResult(
            intent=data.get("intent", "General Request"),
            category=data.get("category", "General"),
            department=data.get("department", "Academic Administration"),
            priority=data.get("priority", "MEDIUM"),
            urgency_score=float(data.get("urgency_score", 0.5)),
            sla_hours=int(data.get("sla_hours", 48)),
            required_documents=data.get("required_documents", ["Student ID"]),
            required_action=data.get("required_action", "Officer Review"),
            confidence=float(data.get("confidence", 0.9)),
            fallback_used=False,
        )

    except Exception as e:
        logger.warning(f"Gemini API failed ({e}), using fallback classifier")
        result = _fallback_classify(description)
        return result
