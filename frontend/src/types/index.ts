// ─── Core Types ──────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'officer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  department?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

// ─── Request Types ────────────────────────────────────────────────────────────

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus =
  | 'SUBMITTED'
  | 'AI_CLASSIFIED'
  | 'DOCUMENT_VERIFIED'
  | 'ROUTED'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED'
  | 'ESCALATED';

export type Department =
  | 'Academic Administration'
  | 'Finance'
  | 'Hostel Administration'
  | 'Examination'
  | 'Placement';

export interface Request {
  id: string;
  request_number: string;
  student_id: string;
  student_name?: string;
  officer_name?: string;
  description: string;
  intent?: string;
  category?: string;
  department?: string;
  priority?: Priority;
  urgency_score?: number;
  status: RequestStatus;
  sla_hours?: number;
  sla_deadline?: string;
  assigned_officer?: string;
  resolution?: string;
  ai_analysis?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  intent: string;
  category: string;
  department: string;
  priority: Priority;
  urgency_score: number;
  sla_hours: number;
  required_documents: string[];
  required_action: string;
  confidence: number;
  fallback_used: boolean;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';

export interface WorkflowStep {
  id: string;
  step_name: string;
  step_order: string;
  status: StepStatus;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  comments?: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  request_id: string;
  filename: string;
  original_filename: string;
  document_type?: string;
  file_url: string;
  extracted_data?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED';
  created_at: string;
}

export interface ExtractedDocumentData {
  document_type: string;
  extracted_fields: Record<string, string>;
  verification_checks: string[];
  ocr_used: boolean;
  confidence: number;
  demo_mode?: boolean;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  request_id?: string;
  title: string;
  message: string;
  notification_type?: string;
  read: boolean;
  created_at: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  request_id?: string;
  actor_id?: string;
  actor_type: string;
  actor_name?: string;
  action: string;
  old_status?: string;
  new_status?: string;
  comments?: string;
  created_at: string;
}

// ─── SLA ──────────────────────────────────────────────────────────────────────

export interface SLAStatus {
  request_id: string;
  request_number: string;
  sla_hours: number;
  sla_deadline?: string;
  hours_remaining?: number;
  minutes_remaining?: number;
  percentage_elapsed: number;
  status: 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'UNKNOWN';
  is_breached: boolean;
  is_warning: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  total: number;
  pending: number;
  resolved: number;
  high_priority: number;
  sla_breaches: number;
  escalated: number;
}

export interface DepartmentStat {
  department: string;
  total: number;
  pending: number;
  resolved: number;
  avg_resolution_hours: number;
  sla_performance: number;
}

export interface BottleneckData {
  department: string;
  avg_resolution_hours: number;
  target_sla_hours: number;
  sla_performance: number;
  pending_requests: number;
  is_bottleneck: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface TrendData {
  date: string;
  submitted: number;
  resolved: number;
}
