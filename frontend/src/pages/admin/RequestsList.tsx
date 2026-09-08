import { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { listRequests } from '../../services/requests';
import { RequestRow } from '../../components/RequestCard';
import type { Request } from '../../types';

export function AdminRequestsList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    listRequests({ status: statusFilter || undefined, priority: priorityFilter || undefined, department: deptFilter || undefined })
      .then(setRequests).finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, deptFilter]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Requests</h1>
          <p className="text-slate-500 text-sm mt-1">{requests.length} total requests</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cf-input w-auto text-sm py-2">
            <option value="">All Statuses</option>
            {['SUBMITTED', 'AI_CLASSIFIED', 'ROUTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'RESOLVED', 'ESCALATED', 'REJECTED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="cf-input w-auto text-sm py-2">
            <option value="">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="cf-input w-auto text-sm py-2">
            <option value="">All Departments</option>
            {['Academic Administration', 'Finance', 'Hostel Administration', 'Examination', 'Placement'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="cf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Request ID', 'Student', 'Service', 'Priority', 'Status', 'Created', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading
                  ? Array.from({length:8}).map((_,i)=>(
                      <tr key={i}>{Array.from({length:7}).map((_,j)=>(
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                  : requests.map(req => (
                      <RequestRow key={req.id} request={req} href={`/officer/requests/${req.id}`} showStudent />
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
