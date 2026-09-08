"""
Analytics Service — CampusFlow AI
Generates dashboard statistics, department analytics, SLA performance, and bottleneck detection.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.request import Request, RequestStatus, Priority
from app.services.sla.monitor import calculate_sla_status


def get_overview(db: Session) -> Dict[str, Any]:
    """Top-level dashboard statistics."""
    total = db.query(Request).count()
    pending = db.query(Request).filter(
        Request.status.in_([
            RequestStatus.SUBMITTED, RequestStatus.AI_CLASSIFIED,
            RequestStatus.DOCUMENT_VERIFIED, RequestStatus.ROUTED,
            RequestStatus.IN_PROGRESS, RequestStatus.PENDING_APPROVAL,
        ])
    ).count()
    resolved = db.query(Request).filter(Request.status == RequestStatus.RESOLVED).count()
    high_priority = db.query(Request).filter(
        Request.priority.in_([Priority.HIGH, Priority.CRITICAL]),
        Request.status.not_in([RequestStatus.RESOLVED, RequestStatus.REJECTED])
    ).count()

    # SLA breaches
    now = datetime.utcnow()
    sla_breaches = db.query(Request).filter(
        Request.sla_deadline < now,
        Request.status.not_in([RequestStatus.RESOLVED, RequestStatus.REJECTED])
    ).count()

    escalated = db.query(Request).filter(Request.status == RequestStatus.ESCALATED).count()

    return {
        "total": total,
        "pending": pending,
        "resolved": resolved,
        "high_priority": high_priority,
        "sla_breaches": sla_breaches,
        "escalated": escalated,
    }


def get_department_stats(db: Session) -> List[Dict[str, Any]]:
    """Per-department request breakdown."""
    departments = ["Academic Administration", "Finance", "Hostel Administration", "Examination", "Placement"]
    stats = []

    for dept in departments:
        total = db.query(Request).filter(Request.department == dept).count()
        pending = db.query(Request).filter(
            Request.department == dept,
            Request.status.not_in([RequestStatus.RESOLVED, RequestStatus.REJECTED])
        ).count()
        resolved = db.query(Request).filter(
            Request.department == dept,
            Request.status == RequestStatus.RESOLVED
        ).count()

        # Average resolution time
        resolved_requests = db.query(Request).filter(
            Request.department == dept,
            Request.status == RequestStatus.RESOLVED,
            Request.resolved_at.isnot(None)
        ).all()

        avg_hours = 0
        if resolved_requests:
            total_hours = sum(
                (r.resolved_at - r.created_at).total_seconds() / 3600
                for r in resolved_requests
            )
            avg_hours = round(total_hours / len(resolved_requests), 1)

        # SLA performance
        dept_requests = db.query(Request).filter(
            Request.department == dept,
            Request.status == RequestStatus.RESOLVED,
            Request.resolved_at.isnot(None),
            Request.sla_deadline.isnot(None)
        ).all()

        sla_met = sum(1 for r in dept_requests if r.resolved_at <= r.sla_deadline)
        sla_performance = round((sla_met / len(dept_requests) * 100) if dept_requests else 100, 1)

        stats.append({
            "department": dept,
            "total": total,
            "pending": pending,
            "resolved": resolved,
            "avg_resolution_hours": avg_hours,
            "sla_performance": sla_performance,
        })

    return stats


def get_priority_breakdown(db: Session) -> Dict[str, int]:
    """Count of requests by priority level."""
    result = {}
    for priority in Priority:
        count = db.query(Request).filter(Request.priority == priority).count()
        result[priority.value] = count
    return result


def get_resolution_trend(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    """Daily resolution counts for the past N days."""
    trend = []
    today = datetime.utcnow().date()

    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        submitted = db.query(Request).filter(
            Request.created_at >= day_start,
            Request.created_at <= day_end
        ).count()

        resolved_count = db.query(Request).filter(
            Request.resolved_at >= day_start,
            Request.resolved_at <= day_end
        ).count()

        trend.append({
            "date": day.strftime("%b %d"),
            "submitted": submitted,
            "resolved": resolved_count,
        })

    return trend


def get_bottlenecks(db: Session) -> List[Dict[str, Any]]:
    """Identify departments with SLA issues and high pending counts."""
    dept_stats = get_department_stats(db)
    bottlenecks = []

    # Standard SLA targets by department (hours)
    sla_targets = {
        "Academic Administration": 24,
        "Finance": 48,
        "Hostel Administration": 24,
        "Examination": 48,
        "Placement": 72,
    }

    recommendations = {
        "Academic Administration": "Consider adding more academic officers during peak admission periods.",
        "Finance": "Automate fee reconciliation checks to reduce manual verification time.",
        "Hostel Administration": "Increase maintenance staff or implement priority-based work orders.",
        "Examination": "Set up dedicated fast-track processing for result-related queries.",
        "Placement": "Add more placement counselors during campus recruitment season.",
    }

    for stat in dept_stats:
        dept = stat["department"]
        target = sla_targets.get(dept, 48)
        avg = stat["avg_resolution_hours"]
        sla_perf = stat["sla_performance"]

        is_bottleneck = (avg > target * 1.5) or (sla_perf < 85) or (stat["pending"] > 10)

        bottlenecks.append({
            "department": dept,
            "avg_resolution_hours": avg,
            "target_sla_hours": target,
            "sla_performance": sla_perf,
            "pending_requests": stat["pending"],
            "is_bottleneck": is_bottleneck,
            "severity": "HIGH" if sla_perf < 75 else ("MEDIUM" if is_bottleneck else "LOW"),
            "recommendation": recommendations.get(dept, "Review staffing levels."),
        })

    # Sort: bottlenecks first, then by severity
    bottlenecks.sort(key=lambda x: (not x["is_bottleneck"], x["sla_performance"]))
    return bottlenecks


def get_sla_performance(db: Session) -> List[Dict[str, Any]]:
    """SLA performance percentage by department."""
    return [
        {
            "department": s["department"],
            "sla_performance": s["sla_performance"],
            "avg_resolution_hours": s["avg_resolution_hours"],
        }
        for s in get_department_stats(db)
    ]
