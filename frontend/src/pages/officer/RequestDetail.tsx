import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, ArrowUp, User,
  Brain, FileText, Activity, Clock, MessageSquare, Loader2
} from 'lucide-react';
import { OfficerLayout } from '../../layouts/OfficerLayout';
import { getRequest, getWorkflow, getRequestDocuments, getRequestAudit, performAction } from '../../services/requests';
import { WorkflowTimeline } from '../../components/WorkflowTimeline';
import { SLACountdown } from '../../components/SLACountdown';
import { AIAnalysisCard } from '../../components/AIAnalysisCard';
import { useSLA } from '../../hooks/useSLA';
import { priorityClass, statusClass, statusLabel, formatDateTime, urgencyPercent } from '../../utils';
import type { Request, WorkflowStep, Document, AuditLog, AIAnalysisResult } from '../../types';

export function OfficerRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai' | 'documents' | 'audit'>('timeline');
  const { sla } = useSLA(id);

  const loadData = async () => {
    if (!id) return;
    const [req, wf, d, a] = await Promise.all([
      getRequest(id), getWorkflow(id), getRequestDocuments(id), getRequestAudit(id)
    ]);
    setRequest(req); setSteps(wf); setDocs(d); setAudit(a);
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    if (!id) return;
    setActionLoading(true);
    setError(''); setSuccess('');
    try {
      await performAction(id, { action, comments });
      setSuccess(`Request ${action}d successfully`);
      setComments('');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <OfficerLayout><div className="p-6 space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="cf-card p-4 animate-pulse h-24" />)}</div></OfficerLayout>;
  }

  if (!request) return <OfficerLayout><div className="p-6 text-slate-500">Request not found.</div></OfficerLayout>;

  const aiAnalysis = request.ai_analysis ? (JSON.parse(request.ai_analysis) as AIAnalysisResult) : null;
  const isActive = !['RESOLVED', 'REJECTED'].includes(request.status);

  const tabs = [
    { key: 'timeline', label: 'Timeline', icon: Activity },
    { key: 'ai', label: 'AI Analysis', icon: Brain },
    { key: 'documents', label: `Documents (${docs.length})`, icon: FileText },
    { key: 'audit', label: 'History', icon: Clock },
  ];

  return (
    <OfficerLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <Link to="/officer/requests" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        {/* Header */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 cf-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-slate-500">{request.request_number}</span>
              {request.priority && <span className={priorityClass(request.priority)}>{request.priority}</span>}
              <span className={statusClass(request.status)}>{statusLabel(request.status)}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{request.intent || 'Service Request'}</h1>
            {request.student_name && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {request.student_name} · {request.department}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{request.description}</p>

            {aiAnalysis && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs">
                <span className="text-slate-500">Urgency: <b className="text-slate-700">{urgencyPercent(aiAnalysis.urgency_score)}%</b></span>
                <span className="text-slate-500">SLA: <b className="text-slate-700">{aiAnalysis.sla_hours}h</b></span>
                <span className="text-slate-500">Category: <b className="text-slate-700">{aiAnalysis.category}</b></span>
              </div>
            )}

            {request.resolution && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-emerald-600 mb-1">Resolution</p>
                <p className="text-sm text-slate-700">{request.resolution}</p>
              </div>
            )}
          </div>

          {/* SLA + action side */}
          <div className="space-y-3">
            {sla && (
              <div className="cf-card p-4">
                <SLACountdown sla={sla} />
              </div>
            )}
            <p className="text-xs text-slate-400 text-center">Submitted {formatDateTime(request.created_at)}</p>
          </div>
        </div>

        {/* Action panel */}
        {isActive && (
          <div className="cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Take Action
            </h3>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="cf-textarea mb-3 h-20"
              placeholder="Add comments or reason (optional)..."
            />
            {success && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700 mb-3">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-3">{error}</div>}
            <div className="flex flex-wrap gap-2">
              <button id="approve-btn" onClick={() => handleAction('approve')} disabled={actionLoading} className="btn-primary py-2 px-4">
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button id="resolve-btn" onClick={() => handleAction('resolve')} disabled={actionLoading} className="bg-emerald-600 text-white btn-primary py-2 px-4">
                <CheckCircle className="w-3.5 h-3.5" />
                Resolve
              </button>
              <button id="reject-btn" onClick={() => handleAction('reject')} disabled={actionLoading} className="btn-danger py-2 px-4">
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
              <button id="escalate-btn" onClick={() => handleAction('escalate')} disabled={actionLoading} className="btn-secondary py-2 px-4">
                <ArrowUp className="w-3.5 h-3.5" />
                Escalate
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === 'timeline' && (
            <div className="cf-card p-5">
              <WorkflowTimeline steps={steps} />
            </div>
          )}
          {activeTab === 'ai' && aiAnalysis && <AIAnalysisCard result={aiAnalysis} />}
          {activeTab === 'documents' && (
            <div className="cf-card p-5">
              {docs.length === 0
                ? <p className="text-sm text-slate-400 text-center py-4">No documents uploaded</p>
                : docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.original_filename}</p>
                        <p className="text-xs text-slate-400">{doc.document_type}</p>
                        {doc.extracted_data && (() => {
                          const data = JSON.parse(doc.extracted_data);
                          return Object.entries(data.extracted_fields || {}).slice(0, 3).map(([k, v]) => (
                            <p key={k} className="text-xs text-slate-500">{k}: <b>{v as string}</b></p>
                          ));
                        })()}
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
          {activeTab === 'audit' && (
            <div className="cf-card p-5">
              <div className="space-y-3">
                {audit.map((log, i) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                      {i < audit.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{log.action}</span>
                        <span className="text-xs text-slate-400">by {log.actor_name}</span>
                      </div>
                      {log.comments && <p className="text-xs text-slate-500 mt-0.5">{log.comments}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </OfficerLayout>
  );
}
