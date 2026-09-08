import type { Priority, RequestStatus } from '../types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function priorityClass(priority?: Priority): string {
  switch (priority) {
    case 'CRITICAL': return 'badge-critical';
    case 'HIGH': return 'badge-high';
    case 'MEDIUM': return 'badge-medium';
    case 'LOW': return 'badge-low';
    default: return 'badge bg-slate-100 text-slate-500';
  }
}

export function statusClass(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    SUBMITTED: 'badge-submitted',
    AI_CLASSIFIED: 'badge-classified',
    DOCUMENT_VERIFIED: 'badge-classified',
    ROUTED: 'badge-routed',
    IN_PROGRESS: 'badge-in-progress',
    PENDING_APPROVAL: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    RESOLVED: 'badge-resolved',
    ESCALATED: 'badge-escalated',
  };
  return map[status] || 'badge bg-slate-100 text-slate-500';
}

export function statusLabel(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    SUBMITTED: 'Submitted',
    AI_CLASSIFIED: 'AI Classified',
    DOCUMENT_VERIFIED: 'Document Verified',
    ROUTED: 'Routed',
    IN_PROGRESS: 'In Progress',
    PENDING_APPROVAL: 'Awaiting Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    RESOLVED: 'Resolved',
    ESCALATED: 'Escalated',
  };
  return map[status] || status;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function urgencyPercent(score: number): number {
  return Math.round(score * 100);
}

export function getDepartmentShort(dept: string): string {
  const map: Record<string, string> = {
    'Academic Administration': 'Academic',
    'Finance': 'Finance',
    'Hostel Administration': 'Hostel',
    'Examination': 'Exam',
    'Placement': 'Placement',
  };
  return map[dept] || dept;
}

export function getDepartmentColor(dept: string): string {
  const map: Record<string, string> = {
    'Academic Administration': '#3b82f6',
    'Finance': '#10b981',
    'Hostel Administration': '#f59e0b',
    'Examination': '#8b5cf6',
    'Placement': '#06b6d4',
  };
  return map[dept] || '#94a3b8';
}
