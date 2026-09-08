"""
CampusFlow AI — Demo Data Seeder
Seeds the database with 50+ realistic demo requests across all departments/priorities/statuses.
Run standalone: python seed.py
Or called automatically on first startup.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import uuid
import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.connection import init_db, SessionLocal
from app.models.user import User, UserRole
from app.models.request import Request, RequestStatus, Priority
from app.models.workflow import WorkflowStep, StepStatus
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.services.auth import hash_password


DEMO_USERS = [
    {
        "id": "student-rahul-001",
        "name": "Rahul Teja",
        "email": "student@campusflow.demo",
        "password": "demo123",
        "role": UserRole.STUDENT,
        "student_id": "STU2026001",
        "department": "Computer Science & Engineering",
    },
    {
        "id": "student-priya-002",
        "name": "Priya Sharma",
        "email": "priya@campusflow.demo",
        "password": "demo123",
        "role": UserRole.STUDENT,
        "student_id": "STU2026002",
        "department": "Electronics & Communication",
    },
    {
        "id": "student-arjun-003",
        "name": "Arjun Mehta",
        "email": "arjun@campusflow.demo",
        "password": "demo123",
        "role": UserRole.STUDENT,
        "student_id": "STU2026003",
        "department": "Mechanical Engineering",
    },
    {
        "id": "officer-academic-001",
        "name": "Dr. Meena Krishnan",
        "email": "officer@campusflow.demo",
        "password": "demo123",
        "role": UserRole.OFFICER,
        "student_id": None,
        "department": "Academic Administration",
    },
    {
        "id": "officer-finance-001",
        "name": "Mr. Suresh Patel",
        "email": "finance.officer@campusflow.demo",
        "password": "demo123",
        "role": UserRole.OFFICER,
        "student_id": None,
        "department": "Finance",
    },
    {
        "id": "officer-hostel-001",
        "name": "Ms. Kavitha Nair",
        "email": "hostel.officer@campusflow.demo",
        "password": "demo123",
        "role": UserRole.OFFICER,
        "student_id": None,
        "department": "Hostel Administration",
    },
    {
        "id": "admin-001",
        "name": "Prof. Rajesh Kumar",
        "email": "admin@campusflow.demo",
        "password": "demo123",
        "role": UserRole.ADMIN,
        "student_id": None,
        "department": "Administration",
    },
]

DEMO_REQUESTS = [
    # ACADEMIC - Certificate - HIGH - RESOLVED
    {
        "description": "I need a bonafide certificate for my scholarship application tomorrow. Please process it urgently.",
        "intent": "Bonafide Certificate",
        "category": "Certificate",
        "department": "Academic Administration",
        "priority": Priority.HIGH,
        "urgency_score": 0.91,
        "sla_hours": 24,
        "status": RequestStatus.RESOLVED,
        "days_ago": 10,
        "resolution": "Bonafide certificate generated and emailed to student.",
        "ai_analysis": json.dumps({
            "intent": "Bonafide Certificate",
            "category": "Certificate",
            "department": "Academic Administration",
            "priority": "HIGH",
            "urgency_score": 0.91,
            "sla_hours": 24,
            "required_documents": ["Student ID"],
            "required_action": "Academic Officer Approval",
        }),
    },
    # FINANCE - Fee Issue - MEDIUM - RESOLVED
    {
        "description": "I paid my semester fee but the portal still shows an outstanding amount of Rs 85,000.",
        "intent": "Fee Payment Discrepancy",
        "category": "Finance",
        "department": "Finance",
        "priority": Priority.MEDIUM,
        "urgency_score": 0.72,
        "sla_hours": 48,
        "status": RequestStatus.RESOLVED,
        "days_ago": 8,
        "resolution": "Payment verified in bank records. Portal updated. Outstanding balance cleared.",
        "ai_analysis": json.dumps({
            "intent": "Fee Payment Discrepancy",
            "category": "Finance",
            "department": "Finance",
            "priority": "MEDIUM",
            "urgency_score": 0.72,
            "sla_hours": 48,
            "required_documents": ["Fee Receipt", "Bank Statement"],
            "required_action": "Finance Officer Verification",
        }),
    },
    # HOSTEL - Maintenance - HIGH - IN_PROGRESS
    {
        "description": "The fan in my hostel room has not been working for three days and my exams start tomorrow.",
        "intent": "Hostel Maintenance - Fan Repair",
        "category": "Hostel",
        "department": "Hostel Administration",
        "priority": Priority.HIGH,
        "urgency_score": 0.88,
        "sla_hours": 24,
        "status": RequestStatus.IN_PROGRESS,
        "days_ago": 0,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Hostel Maintenance - Fan Repair",
            "category": "Hostel",
            "department": "Hostel Administration",
            "priority": "HIGH",
            "urgency_score": 0.88,
            "sla_hours": 24,
            "required_documents": ["Room Allotment Letter"],
            "required_action": "Maintenance Team Assignment",
        }),
    },
    # ACADEMIC - Transcript - MEDIUM - PENDING_APPROVAL
    {
        "description": "I need my official transcript for my university transfer application. Please issue it at the earliest.",
        "intent": "Official Transcript",
        "category": "Certificate",
        "department": "Academic Administration",
        "priority": Priority.MEDIUM,
        "urgency_score": 0.68,
        "sla_hours": 48,
        "status": RequestStatus.PENDING_APPROVAL,
        "days_ago": 1,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Official Transcript",
            "category": "Certificate",
            "department": "Academic Administration",
            "priority": "MEDIUM",
            "urgency_score": 0.68,
            "sla_hours": 48,
            "required_documents": ["Student ID", "Application Letter"],
            "required_action": "Academic Officer Approval",
        }),
    },
    # FINANCE - Refund - HIGH - ESCALATED (SLA breached)
    {
        "description": "I am requesting a fee refund as I have withdrawn from this semester due to medical reasons.",
        "intent": "Fee Refund Request",
        "category": "Finance",
        "department": "Finance",
        "priority": Priority.HIGH,
        "urgency_score": 0.85,
        "sla_hours": 48,
        "status": RequestStatus.ESCALATED,
        "days_ago": 5,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Fee Refund Request",
            "category": "Finance",
            "department": "Finance",
            "priority": "HIGH",
            "urgency_score": 0.85,
            "sla_hours": 48,
            "required_documents": ["Medical Certificate", "Fee Receipt"],
            "required_action": "Finance Manager Approval",
        }),
    },
    # EXAMINATION - Result - MEDIUM - RESOLVED
    {
        "description": "There seems to be an error in my semester 4 result. My internal marks are incorrect.",
        "intent": "Result Discrepancy",
        "category": "Examination",
        "department": "Examination",
        "priority": Priority.MEDIUM,
        "urgency_score": 0.70,
        "sla_hours": 48,
        "status": RequestStatus.RESOLVED,
        "days_ago": 15,
        "resolution": "Internal marks verified and corrected. Updated result published.",
        "ai_analysis": json.dumps({
            "intent": "Result Discrepancy",
            "category": "Examination",
            "department": "Examination",
            "priority": "MEDIUM",
            "urgency_score": 0.70,
            "sla_hours": 48,
            "required_documents": ["Student ID", "Mark Sheet"],
            "required_action": "Examination Officer Review",
        }),
    },
    # HOSTEL - Water - HIGH - ESCALATED
    {
        "description": "There is no water supply in Block C hostel since morning. This is a critical issue.",
        "intent": "Hostel Water Supply Failure",
        "category": "Hostel",
        "department": "Hostel Administration",
        "priority": Priority.CRITICAL,
        "urgency_score": 0.95,
        "sla_hours": 12,
        "status": RequestStatus.ESCALATED,
        "days_ago": 2,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Hostel Water Supply Failure",
            "category": "Hostel",
            "department": "Hostel Administration",
            "priority": "CRITICAL",
            "urgency_score": 0.95,
            "sla_hours": 12,
            "required_documents": [],
            "required_action": "Emergency Maintenance Assignment",
        }),
    },
    # PLACEMENT - Internship - LOW - ROUTED
    {
        "description": "I need an internship verification letter for the company I am joining next month.",
        "intent": "Internship Verification Letter",
        "category": "Placement",
        "department": "Placement",
        "priority": Priority.LOW,
        "urgency_score": 0.45,
        "sla_hours": 72,
        "status": RequestStatus.ROUTED,
        "days_ago": 0,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Internship Verification Letter",
            "category": "Placement",
            "department": "Placement",
            "priority": "LOW",
            "urgency_score": 0.45,
            "sla_hours": 72,
            "required_documents": ["Offer Letter", "Student ID"],
            "required_action": "Placement Officer Review",
        }),
    },
    # ACADEMIC - Character Certificate - HIGH - APPROVED
    {
        "description": "I require a character certificate for my visa application. The interview is in 3 days.",
        "intent": "Character Certificate",
        "category": "Certificate",
        "department": "Academic Administration",
        "priority": Priority.HIGH,
        "urgency_score": 0.87,
        "sla_hours": 24,
        "status": RequestStatus.APPROVED,
        "days_ago": 1,
        "resolution": None,
        "ai_analysis": json.dumps({
            "intent": "Character Certificate",
            "category": "Certificate",
            "department": "Academic Administration",
            "priority": "HIGH",
            "urgency_score": 0.87,
            "sla_hours": 24,
            "required_documents": ["Student ID", "Passport Copy"],
            "required_action": "Academic Officer Approval",
        }),
    },
    # FINANCE - Scholarship - MEDIUM - RESOLVED
    {
        "description": "My scholarship amount has not been credited this month. Please check and resolve.",
        "intent": "Scholarship Disbursement Issue",
        "category": "Finance",
        "department": "Finance",
        "priority": Priority.MEDIUM,
        "urgency_score": 0.75,
        "sla_hours": 48,
        "status": RequestStatus.RESOLVED,
        "days_ago": 12,
        "resolution": "Scholarship disbursement verified. Amount credited to student account.",
        "ai_analysis": json.dumps({
            "intent": "Scholarship Disbursement Issue",
            "category": "Finance",
            "department": "Finance",
            "priority": "MEDIUM",
            "urgency_score": 0.75,
            "sla_hours": 48,
            "required_documents": ["Scholarship Sanction Letter", "Bank Details"],
            "required_action": "Finance Officer Verification",
        }),
    },
]

# Generate more varied requests to reach 50+
ADDITIONAL_REQUEST_TEMPLATES = [
    ("I need my enrollment verification letter for my bank loan application.", "Enrollment Verification", "Certificate", "Academic Administration", Priority.MEDIUM, 0.65, 48),
    ("The WiFi in the library is not working for the past two days.", "WiFi Issue", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.60, 24),
    ("I have a duplicate charge on my fee account. Please reverse the extra amount.", "Duplicate Fee Charge", "Finance", "Finance", Priority.HIGH, 0.80, 48),
    ("I need my degree certificate for a job offer I have received.", "Degree Certificate", "Certificate", "Academic Administration", Priority.HIGH, 0.82, 24),
    ("My hall ticket for the upcoming exam has a wrong roll number.", "Hall Ticket Error", "Examination", "Examination", Priority.CRITICAL, 0.92, 24),
    ("Requesting late fee waiver due to my hospitalization last month.", "Late Fee Waiver", "Finance", "Finance", Priority.MEDIUM, 0.70, 48),
    ("The air conditioner in Room 204 is not working.", "AC Repair Request", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.65, 24),
    ("I need a migration certificate to join another institution.", "Migration Certificate", "Certificate", "Academic Administration", Priority.HIGH, 0.78, 48),
    ("Need placement cell assistance for mock interview preparation.", "Mock Interview Request", "Placement", "Placement", Priority.LOW, 0.40, 72),
    ("My reevaluation request for Semester 5 Mathematics has not been processed.", "Reevaluation Request", "Examination", "Examination", Priority.MEDIUM, 0.72, 48),
    ("Requesting confirmation of enrollment for scholarship renewal.", "Enrollment Confirmation", "Certificate", "Academic Administration", Priority.MEDIUM, 0.60, 48),
    ("The mess food quality has been very poor this week.", "Mess Quality Complaint", "Hostel", "Hostel Administration", Priority.LOW, 0.45, 48),
    ("I need my fee payment confirmation letter for tax filing.", "Fee Payment Confirmation", "Finance", "Finance", Priority.LOW, 0.40, 72),
    ("Requesting additional time to pay semester fees due to financial difficulty.", "Fee Extension Request", "Finance", "Finance", Priority.MEDIUM, 0.68, 48),
    ("I was marked absent in an exam I attended. Please check.", "Attendance Discrepancy", "Examination", "Examination", Priority.HIGH, 0.85, 24),
    ("Lights in the common room of hostel Block B are not working.", "Electrical Repair", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.55, 24),
    ("Need a letter confirming my course details for Erasmus scholarship.", "Course Details Letter", "Certificate", "Academic Administration", Priority.HIGH, 0.80, 24),
    ("I lost my student ID card. Need a duplicate.", "Student ID Replacement", "Certificate", "Academic Administration", Priority.MEDIUM, 0.60, 48),
    ("The water purifier in our hostel floor is broken.", "Water Purifier Repair", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.65, 24),
    ("Requesting placement cell to register me for upcoming campus drives.", "Campus Drive Registration", "Placement", "Placement", Priority.MEDIUM, 0.55, 72),
    ("My final year project guide has not been assigned yet.", "Project Guide Assignment", "Certificate", "Academic Administration", Priority.MEDIUM, 0.60, 48),
    ("Fee payment receipt not generated after successful online payment.", "Receipt Generation Issue", "Finance", "Finance", Priority.HIGH, 0.82, 24),
    ("Need urgent backlog clearance certificate for my visa.", "Backlog Certificate", "Certificate", "Academic Administration", Priority.HIGH, 0.88, 24),
    ("The door lock of my hostel room is broken.", "Room Lock Repair", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.70, 24),
    ("Requesting change of hostel room due to health reasons.", "Room Change Request", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.65, 48),
    ("I need my semester grade card for my postgraduate application.", "Grade Card Request", "Certificate", "Academic Administration", Priority.MEDIUM, 0.65, 48),
    ("My timetable clash needs to be resolved before exams begin.", "Timetable Clash", "Examination", "Examination", Priority.HIGH, 0.85, 24),
    ("The CCTV camera near our hostel block is not functioning.", "CCTV Repair", "Hostel", "Hostel Administration", Priority.LOW, 0.50, 72),
    ("Need the college to issue an experience letter for my internship.", "Internship Letter", "Placement", "Placement", Priority.MEDIUM, 0.60, 72),
    ("My library fine amount is showing incorrectly on the portal.", "Library Fine Dispute", "Finance", "Finance", Priority.LOW, 0.40, 72),
    ("The projector in Room 301 is not working. Affecting lectures.", "Projector Repair", "Hostel", "Hostel Administration", Priority.MEDIUM, 0.58, 48),
    ("I need proof of my current student status for my bank.", "Student Status Proof", "Certificate", "Academic Administration", Priority.MEDIUM, 0.62, 48),
    ("Scholarship application deadline is tomorrow but portal is showing error.", "Scholarship Portal Error", "Finance", "Finance", Priority.CRITICAL, 0.95, 24),
    ("I received a wrong mark in internal assessment for Networks subject.", "Internal Assessment Error", "Examination", "Examination", Priority.HIGH, 0.82, 48),
    ("Need no-dues certificate from the hostel office for graduation.", "No Dues Certificate", "Certificate", "Academic Administration", Priority.MEDIUM, 0.58, 48),
    ("The geyser in the hostel bathroom is not working in winter.", "Geyser Repair", "Hostel", "Hostel Administration", Priority.HIGH, 0.80, 24),
    ("Requesting fee concession for next semester due to parent's job loss.", "Fee Concession Request", "Finance", "Finance", Priority.HIGH, 0.85, 48),
    ("I was not registered for the supplementary exam. Please check.", "Supplementary Exam Registration", "Examination", "Examination", Priority.HIGH, 0.88, 24),
    ("Need placement training schedule and materials.", "Placement Training Request", "Placement", "Placement", Priority.LOW, 0.42, 72),
    ("Requesting a copy of my degree certificate as the original was damaged.", "Duplicate Degree Certificate", "Certificate", "Academic Administration", Priority.HIGH, 0.78, 48),
]


def get_random_status_for_age(days_ago: int):
    """Generate realistic status based on how old the request is."""
    if days_ago > 7:
        return random.choice([RequestStatus.RESOLVED, RequestStatus.RESOLVED, RequestStatus.RESOLVED, RequestStatus.REJECTED])
    elif days_ago > 3:
        return random.choice([RequestStatus.RESOLVED, RequestStatus.APPROVED, RequestStatus.IN_PROGRESS, RequestStatus.ESCALATED])
    elif days_ago > 1:
        return random.choice([RequestStatus.PENDING_APPROVAL, RequestStatus.IN_PROGRESS, RequestStatus.ROUTED, RequestStatus.APPROVED])
    else:
        return random.choice([RequestStatus.SUBMITTED, RequestStatus.AI_CLASSIFIED, RequestStatus.ROUTED, RequestStatus.IN_PROGRESS])


def create_workflow_steps(db: Session, request_id: str, category: str, status: RequestStatus):
    """Create workflow steps appropriate to the request status."""
    from app.services.workflow.orchestrator import WORKFLOW_TEMPLATES
    template = WORKFLOW_TEMPLATES.get(category, WORKFLOW_TEMPLATES["General"])

    # How many steps are complete based on status
    completion_map = {
        RequestStatus.SUBMITTED: 1,
        RequestStatus.AI_CLASSIFIED: 2,
        RequestStatus.DOCUMENT_VERIFIED: 3,
        RequestStatus.ROUTED: 3,
        RequestStatus.IN_PROGRESS: 4,
        RequestStatus.PENDING_APPROVAL: 4,
        RequestStatus.APPROVED: 5,
        RequestStatus.RESOLVED: len(template),
        RequestStatus.REJECTED: 3,
        RequestStatus.ESCALATED: 4,
    }

    completed_count = completion_map.get(status, 2)
    now = datetime.utcnow()

    for i, step_def in enumerate(template):
        step_num = i + 1
        if step_num <= completed_count - 1:
            step_status = StepStatus.COMPLETED
        elif step_num == completed_count:
            step_status = StepStatus.IN_PROGRESS if status not in [
                RequestStatus.RESOLVED, RequestStatus.REJECTED
            ] else StepStatus.COMPLETED
        else:
            step_status = StepStatus.PENDING

        step = WorkflowStep(
            id=str(uuid.uuid4()),
            request_id=request_id,
            step_name=step_def["step_name"],
            step_order=step_def["step_order"],
            status=step_status,
            started_at=now - timedelta(hours=random.randint(1, 5)) if step_status != StepStatus.PENDING else None,
            completed_at=now - timedelta(hours=random.randint(0, 2)) if step_status == StepStatus.COMPLETED else None,
        )
        db.add(step)


def seed_database(db: Session):
    """Seed the database with demo users and 50+ requests."""
    print("*** Seeding CampusFlow AI database...")

    # Create users
    users = {}
    for u in DEMO_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                id=u["id"],
                name=u["name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                student_id=u.get("student_id"),
                department=u.get("department"),
            )
            db.add(user)
            users[u["email"]] = user
        else:
            users[u["email"]] = existing

    db.commit()

    # Student and officer IDs
    student_ids = [
        "student-rahul-001",
        "student-priya-002",
        "student-arjun-003",
    ]
    officer_map = {
        "Academic Administration": "officer-academic-001",
        "Finance": "officer-finance-001",
        "Hostel Administration": "officer-hostel-001",
        "Examination": "officer-academic-001",
        "Placement": "officer-academic-001",
    }

    year = datetime.utcnow().year
    count = db.query(Request).count()

    # Create the 10 detailed requests
    all_request_defs = DEMO_REQUESTS.copy()

    # Add the additional requests
    statuses_pool = [
        RequestStatus.RESOLVED, RequestStatus.RESOLVED, RequestStatus.RESOLVED,
        RequestStatus.PENDING_APPROVAL, RequestStatus.IN_PROGRESS,
        RequestStatus.ROUTED, RequestStatus.APPROVED, RequestStatus.ESCALATED,
        RequestStatus.REJECTED
    ]

    for template in ADDITIONAL_REQUEST_TEMPLATES:
        desc, intent, category, department, priority, urgency, sla_h = template
        days_ago = random.randint(0, 20)
        status = get_random_status_for_age(days_ago)
        all_request_defs.append({
            "description": desc,
            "intent": intent,
            "category": category,
            "department": department,
            "priority": priority,
            "urgency_score": urgency,
            "sla_hours": sla_h,
            "status": status,
            "days_ago": days_ago,
            "resolution": f"{intent} processed and resolved." if status == RequestStatus.RESOLVED else None,
            "ai_analysis": json.dumps({
                "intent": intent,
                "category": category,
                "department": department,
                "priority": priority.value,
                "urgency_score": urgency,
                "sla_hours": sla_h,
                "required_documents": ["Student ID"],
                "required_action": "Officer Review",
            }),
        })

    for req_def in all_request_defs:
        count += 1
        request_number = f"CF-{year}-{count:03d}"

        days_ago = req_def.get("days_ago", random.randint(0, 20))
        created_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
        sla_hours = req_def["sla_hours"]
        sla_deadline = created_at + timedelta(hours=sla_hours)

        status = req_def["status"]
        resolved_at = None
        if status == RequestStatus.RESOLVED:
            resolved_at = sla_deadline - timedelta(hours=random.randint(1, max(1, sla_hours - 5)))

        student_id = random.choice(student_ids)
        dept = req_def["department"]
        officer_id = officer_map.get(dept, "officer-academic-001")

        req = Request(
            id=str(uuid.uuid4()),
            request_number=request_number,
            student_id=student_id,
            description=req_def["description"],
            intent=req_def["intent"],
            category=req_def["category"],
            department=dept,
            priority=req_def["priority"],
            urgency_score=req_def["urgency_score"],
            sla_hours=sla_hours,
            sla_deadline=sla_deadline,
            status=status,
            assigned_officer=officer_id,
            resolution=req_def.get("resolution"),
            ai_analysis=req_def.get("ai_analysis"),
            created_at=created_at,
            updated_at=created_at + timedelta(minutes=random.randint(5, 120)),
            resolved_at=resolved_at,
        )
        db.add(req)
        db.flush()

        # Create workflow steps
        create_workflow_steps(db, req.id, req_def["category"], status)

        # Create audit logs
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            request_id=req.id,
            actor_id=student_id,
            actor_type="STUDENT",
            actor_name="Student",
            action="Request Submitted",
            new_status="SUBMITTED",
            created_at=created_at,
        ))
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            request_id=req.id,
            actor_id=None,
            actor_type="AI_SYSTEM",
            actor_name="AI System",
            action="Request AI Classified",
            old_status="SUBMITTED",
            new_status="AI_CLASSIFIED",
            comments=f"Intent: {req_def['intent']}, Dept: {dept}, Priority: {req_def['priority'].value}",
            created_at=created_at + timedelta(minutes=2),
        ))
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            request_id=req.id,
            actor_id=None,
            actor_type="SYSTEM",
            actor_name="System",
            action="Request Routed",
            old_status="AI_CLASSIFIED",
            new_status="ROUTED",
            comments=f"Routed to {dept}",
            created_at=created_at + timedelta(minutes=5),
        ))
        if status in [RequestStatus.RESOLVED, RequestStatus.APPROVED]:
            db.add(AuditLog(
                id=str(uuid.uuid4()),
                request_id=req.id,
                actor_id=officer_id,
                actor_type="OFFICER",
                actor_name="Officer",
                action="Request Approved",
                old_status="PENDING_APPROVAL",
                new_status="APPROVED",
                created_at=created_at + timedelta(hours=random.randint(2, 10)),
            ))
        if status == RequestStatus.RESOLVED:
            db.add(AuditLog(
                id=str(uuid.uuid4()),
                request_id=req.id,
                actor_id=officer_id,
                actor_type="OFFICER",
                actor_name="Officer",
                action="Request Resolved",
                old_status="APPROVED",
                new_status="RESOLVED",
                comments=req_def.get("resolution", "Resolved"),
                created_at=resolved_at or (created_at + timedelta(hours=sla_hours - 2)),
            ))
        if status == RequestStatus.ESCALATED:
            db.add(AuditLog(
                id=str(uuid.uuid4()),
                request_id=req.id,
                actor_id=None,
                actor_type="SYSTEM",
                actor_name="System",
                action="Automatic SLA Escalation",
                old_status="IN_PROGRESS",
                new_status="ESCALATED",
                comments="SLA deadline breached. Escalated to Department Head.",
                created_at=sla_deadline + timedelta(hours=1),
            ))

        # Create student notification
        db.add(Notification(
            id=str(uuid.uuid4()),
            user_id=student_id,
            request_id=req.id,
            title="Request Submitted",
            message=f"Your request {request_number} has been submitted and is being processed.",
            notification_type="SUBMITTED",
            read=days_ago > 1,
            created_at=created_at,
        ))
        if status not in [RequestStatus.SUBMITTED, RequestStatus.AI_CLASSIFIED]:
            db.add(Notification(
                id=str(uuid.uuid4()),
                user_id=student_id,
                request_id=req.id,
                title="Request Routed",
                message=f"Your request {request_number} has been routed to {dept}.",
                notification_type="ROUTED",
                read=days_ago > 0,
                created_at=created_at + timedelta(minutes=5),
            ))

    db.commit()
    print(f"[OK] Seeded {count} requests and {len(DEMO_USERS)} users successfully.")
    print("\nDemo Accounts:")
    print("  Student:  student@campusflow.demo / demo123")
    print("  Officer:  officer@campusflow.demo / demo123")
    print("  Admin:    admin@campusflow.demo / demo123")


if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
