from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.request import Request
from app.models.workflow import WorkflowStep
from app.schemas.request import WorkflowStepOut
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("/{request_id}", response_model=List[WorkflowStepOut])
def get_workflow(
    request_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all workflow steps for a request."""
    steps = db.query(WorkflowStep).filter(
        WorkflowStep.request_id == request_id
    ).order_by(WorkflowStep.step_order).all()
    return steps
