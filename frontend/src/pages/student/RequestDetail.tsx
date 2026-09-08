import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Brain, FileText, Activity, Clock,
  User, CheckCircle, AlertTriangle
} from 'lucide-react';
import { StudentLayout } from '../../layouts/StudentLayout';
import { getRequest, getWorkflow, getRequestDocuments, getRequestAudit } from '../../services/requests';
import { WorkflowTimeline } from '../../components/WorkflowTimeline';
import { SLACountdown } from '../../components/SLACountdown';
import { AIAnalysisCard } from '../../components/AIAnalysisCard';
import { useSLA } from '../../hooks/useSLA';
import { priorityClass, statusClass, statusLabel, formatDateTime } from '../../utils';
import type { Request, WorkflowStep, Document, AuditLog, AIAnalysisResult } from '../../types';

export function StudentRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai' | 'documents' | 'audit'>('timeline');
  const { sla } = useSLA(id);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getRequest(id),
      getWorkflow(id),
      getRequestDocuments(id),
      getRequestAudit(id),
    ]).then(([req, wf, d, a]) => {
      setRequest(req);
      setSteps(wf);
      setDocs(d);
      setAudit(a);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="cf-card p-4 animate-pulse h-24" />
          ))}
        </div>
      </StudentLayout>
    );
  }

  if (!request) {
    return (
      <StudentLayout>
        <div className="p-6 text-center text-slate-500">Request not found.</div>
      </StudentLayout>
    );
  }

  const aiAnalysis = request.ai_analysis
    ? (JSON.parse(request.ai_analysis) as AIAnalysisResult)
    : null;

  const tabs = [
    { key: 'timeline', label: 'Timeline', icon: Activity },
    { key: 'ai', label: 'AI Analysis', icon: Brain },
    { key: 'documents', label: `Documents (${docs.length})`, icon: FileText },
    { key: 'audit', label: 'Audit History', icon: Clock },
  ];

  return (
    <StudentLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Back */}
        <Link to="/student/requests" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        {/* Header card */}
        <div className="cf-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-bold text-slate-600">{request.request_number}</span>
                {request.priority && (
                  <span className={priorityClass(request.priority)}>{request.priority}</span>
                )}
                <span className={statusClass(request.status)}>{statusLabel(request.status)}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900">
                {request.intent || 'Service Request'}
              </h1>
              {request.department && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {request.department}
                  {request.officer_name && ` · ${request.officer_name}`}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Submitted {formatDateTime(request.created_at)}
              </p>
            </div>

            {/* Status icon */}
            <div>
              {request.status === 'RESOLVED' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              ) : request.status === 'ESCALATED' ? (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{request.description}</p>
          </div>

          {/* SLA */}
          {sla && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <SLACountdown sla={sla} />
            </div>
          )}

          {/* Resolution */}
          {request.resolution && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-emerald-600 mb-1">Resolution</p>
              <p className="text-sm text-slate-700">{request.resolution}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all
                ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === 'timeline' && (
            <div className="cf-card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Request Timeline</h3>
              {steps.length > 0 ? (
                <WorkflowTimeline steps={steps} />
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Workflow will appear once the request is classified
                </p>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            aiAnalysis ? (
              <AIAnalysisCard result={aiAnalysis} />
            ) : (
              <div className="cf-card p-8 text-center text-slate-400 text-sm">
                AI analysis pending
              </div>
            )
          )}

          {activeTab === 'documents' && (
            <div className="cf-card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Uploaded Documents</h3>
              {docs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.original_filename}</p>
                        <p className="text-xs text-slate-400">{doc.document_type} · {doc.verification_status}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${doc.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {doc.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="cf-card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Activity History</h3>
              <div className="space-y-3">
                {audit.map((log, i) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                      {i < audit.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{log.action}</span>
                        <span className="text-xs text-slate-400">by {log.actor_name || log.actor_type}</span>
                      </div>
                      {log.comments && (
                        <p className="text-xs text-slate-500 mt-0.5">{log.comments}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
