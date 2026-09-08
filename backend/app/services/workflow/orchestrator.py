"""
Workflow Orchestrator Interface — CampusFlow AI

Defines the abstract WorkflowOrchestrator interface.
This is designed to be replaced with a NewgenONE implementation when credentials are available.

IMPORTANT: This interface separates the workflow engine from the rest of the application.
To integrate with real NewgenONE:
1. Implement NewgenWorkflowOrchestrator(WorkflowOrchestrator)
2. Configure NEWGEN_API_URL and NEWGEN_API_KEY in .env
3. Swap the import in main.py
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class WorkflowOrchestrator(ABC):
    """
    Abstract workflow orchestrator interface.
    
    In production, this should be implemented by NewgenWorkflowOrchestrator
    using the NewgenONE BPM platform APIs.
    """

    @abstractmethod
    async def create_case(self, request_id: str, category: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new workflow case for the given request."""
        pass

    @abstractmethod
    async def route_case(self, request_id: str, department: str, priority: str) -> Dict[str, Any]:
        """Route the case to the appropriate department."""
        pass

    @abstractmethod
    async def start_workflow(self, request_id: str, workflow_type: str) -> List[Dict[str, Any]]:
        """Start the workflow and return the list of steps."""
        pass

    @abstractmethod
    async def approve_step(self, request_id: str, step_id: str, officer_id: str, comments: str = "") -> Dict[str, Any]:
        """Approve the current workflow step."""
        pass

    @abstractmethod
    async def reject_step(self, request_id: str, step_id: str, officer_id: str, reason: str) -> Dict[str, Any]:
        """Reject the current workflow step."""
        pass

    @abstractmethod
    async def escalate_case(self, request_id: str, reason: str, escalated_to: str) -> Dict[str, Any]:
        """Escalate the case (e.g., SLA breach)."""
        pass

    @abstractmethod
    async def complete_case(self, request_id: str, resolution: str) -> Dict[str, Any]:
        """Mark the case as complete/resolved."""
        pass

    @abstractmethod
    async def get_workflow_status(self, request_id: str) -> Dict[str, Any]:
        """Get the current workflow status and steps."""
        pass


# Workflow step templates by category
WORKFLOW_TEMPLATES = {
    "Certificate": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Document Verification", "step_order": "3"},
        {"step_name": "Routed to Academic Office", "step_order": "4"},
        {"step_name": "Officer Review", "step_order": "5"},
        {"step_name": "Approval", "step_order": "6"},
        {"step_name": "Certificate Generation", "step_order": "7"},
        {"step_name": "Completed", "step_order": "8"},
    ],
    "Finance": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Receipt Verification", "step_order": "3"},
        {"step_name": "Routed to Finance Office", "step_order": "4"},
        {"step_name": "Finance Officer Review", "step_order": "5"},
        {"step_name": "Verification", "step_order": "6"},
        {"step_name": "Approval", "step_order": "7"},
        {"step_name": "Completed", "step_order": "8"},
    ],
    "Hostel": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Routed to Hostel Office", "step_order": "3"},
        {"step_name": "Maintenance Assignment", "step_order": "4"},
        {"step_name": "Action Taken", "step_order": "5"},
        {"step_name": "Verification", "step_order": "6"},
        {"step_name": "Completed", "step_order": "7"},
    ],
    "Examination": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Routed to Examination Office", "step_order": "3"},
        {"step_name": "Officer Review", "step_order": "4"},
        {"step_name": "Approval", "step_order": "5"},
        {"step_name": "Completed", "step_order": "6"},
    ],
    "Placement": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Routed to Placement Cell", "step_order": "3"},
        {"step_name": "Counselor Review", "step_order": "4"},
        {"step_name": "Action Taken", "step_order": "5"},
        {"step_name": "Completed", "step_order": "6"},
    ],
    "General": [
        {"step_name": "Request Submitted", "step_order": "1"},
        {"step_name": "AI Classification", "step_order": "2"},
        {"step_name": "Routed to Department", "step_order": "3"},
        {"step_name": "Officer Review", "step_order": "4"},
        {"step_name": "Completed", "step_order": "5"},
    ],
}
