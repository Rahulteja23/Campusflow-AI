from fastapi import APIRouter, Depends
from app.schemas.request import AIAnalysisRequest, AIAnalysisResult
from app.services.ai.classifier import classify_request
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze-request", response_model=AIAnalysisResult)
async def analyze_request(
    payload: AIAnalysisRequest,
    current_user=Depends(get_current_user)
):
    """
    Analyze a student request using AI.
    Returns structured classification: intent, department, priority, urgency, SLA.
    """
    return await classify_request(payload.description)
