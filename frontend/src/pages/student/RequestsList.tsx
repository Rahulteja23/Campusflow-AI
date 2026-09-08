import { useState, useEffect } from 'react';
import { StudentLayout } from '../../layouts/StudentLayout';
import { listRequests } from '../../services/requests';
import { RequestCard } from '../../components/RequestCard';
import type { Request, RequestStatus, Priority } from '../../types';

export function StudentRequestsList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    listRequests({ status: statusFilter || undefined, priority: priorityFilter || undefined })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  return (
    <StudentLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your service requests</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cf-input w-auto text-sm py-2"
          >
            <option value="">All Statuses</option>
            {['SUBMITTED', 'AI_CLASSIFIED', 'ROUTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'RESOLVED', 'ESCALATED', 'REJECTED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="cf-input w-auto text-sm py-2"
          >
            <option value="">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Request list */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="cf-card p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              ))
            : requests.length === 0
            ? (
              <div className="cf-card p-8 text-center text-slate-500">
                <p className="text-sm">No requests found</p>
              </div>
            )
            : requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  href={`/student/requests/${req.id}`}
                />
              ))
          }
        </div>
      </div>
    </StudentLayout>
  );
}
