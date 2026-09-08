import api from './api';
import type {
  Request, AIAnalysisResult, WorkflowStep,
  Document, AuditLog, SLAStatus
} from '../types';

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function createRequest(description: string): Promise<Request> {
  const { data } = await api.post<Request>('/api/requests', { description });
  return data;
}

export async function listRequests(params?: {
  status?: string;
  priority?: string;
  department?: string;
}): Promise<Request[]> {
  const { data } = await api.get<Request[]>('/api/requests', { params });
  return data;
}

export async function getRequest(id: string): Promise<Request> {
  const { data } = await api.get<Request>(`/api/requests/${id}`);
  return data;
}

export async function updateRequest(id: string, payload: {
  status?: string;
  priority?: string;
  resolution?: string;
  comments?: string;
  assigned_officer?: string;
}): Promise<Request> {
  const { data } = await api.patch<Request>(`/api/requests/${id}`, payload);
  return data;
}

export async function classifyRequest(requestId: string): Promise<AIAnalysisResult> {
  const { data } = await api.post<AIAnalysisResult>(`/api/requests/${requestId}/classify`);
  return data;
}

export async function performAction(requestId: string, payload: {
  action: string;
  comments?: string;
  assigned_officer_id?: string;
}): Promise<unknown> {
  const { data } = await api.post(`/api/requests/${requestId}/action`, payload);
  return data;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export async function analyzeRequest(description: string): Promise<AIAnalysisResult> {
  const { data } = await api.post<AIAnalysisResult>('/api/ai/analyze-request', { description });
  return data;
}

// ─── Workflows ───────────────────────────────────────────────────────────────

export async function getWorkflow(requestId: string): Promise<WorkflowStep[]> {
  const { data } = await api.get<WorkflowStep[]>(`/api/workflows/${requestId}`);
  return data;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function uploadDocument(requestId: string, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append('request_id', requestId);
  formData.append('file', file);
  const { data } = await api.post<Document>('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeDocument(requestId: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('request_id', requestId);
  formData.append('file', file);
  const { data } = await api.post('/api/documents/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getRequestDocuments(requestId: string): Promise<Document[]> {
  const { data } = await api.get<Document[]>(`/api/documents/request/${requestId}`);
  return data;
}

// ─── SLA ─────────────────────────────────────────────────────────────────────

export async function getSLAStatus(requestId: string): Promise<SLAStatus> {
  const { data } = await api.get<SLAStatus>(`/api/sla/${requestId}`);
  return data;
}

export async function checkAndEscalate(): Promise<unknown> {
  const { data } = await api.post('/api/sla/check');
  return data;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function getRequestAudit(requestId: string): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>(`/api/audit/request/${requestId}`);
  return data;
}

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>('/api/audit');
  return data;
}
