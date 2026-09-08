from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.services.deps import require_admin
from app.services.analytics.generator import (
    get_overview, get_department_stats, get_priority_breakdown,
    get_resolution_trend, get_bottlenecks, get_sla_performance
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def analytics_overview(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_overview(db)


@router.get("/departments")
def analytics_departments(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_department_stats(db)


@router.get("/priorities")
def analytics_priorities(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_priority_breakdown(db)


@router.get("/sla")
def analytics_sla(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_sla_performance(db)


@router.get("/bottlenecks")
def analytics_bottlenecks(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_bottlenecks(db)


@router.get("/trends")
def analytics_trends(
    days: int = Query(default=30, ge=7, le=90),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_resolution_trend(db, days)
