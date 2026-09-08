import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { OfficerLayout } from '../../layouts/OfficerLayout';
import { listRequests } from '../../services/requests';
import { useAuth } from '../../hooks/useAuth';
import { RequestRow } from '../../components/RequestCard';
import type { Request } from '../../types';

export function OfficerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  const pending = requests.filter(r => ['PENDING_APPROVAL', 'IN_PROGRESS', 'ROUTED'].includes(r.status));
  const highPriority = requests.filter(r => ['HIGH', 'CRITICAL'].includes(r.priority || ''));
  const dueToday = requests.filter(r => {
    if (!r.sla_deadline) return false;
    const deadline = new Date(r.sla_deadline);
    const today = new Date();
    return deadline.toDateString() === today.toDateString();
  });

  const now = new Date();
  const slaAtRisk = requests.filter(r => {
    if (!r.sla_deadline || ['RESOLVED', 'REJECTED'].includes(r.status)) return false;
    const deadline = new Date(r.sla_deadline);
    const hoursLeft = (deadline.getTime() - now.getTime()) / 3600000;
    return hoursLeft < 6;
  });

  return (
    <OfficerLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.name} · {user?.department}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Assigned" value={requests.length} icon={<FileText className="w-5 h-5 text-blue-500" />} />
          <StatCard label="High Priority" value={highPriority.length} icon={<TrendingUp className="w-5 h-5 text-orange-500" />} color="orange" />
          <StatCard label="Due Today" value={dueToday.length} icon={<Clock className="w-5 h-5 text-amber-500" />} color="amber" />
          <StatCard label="SLA At Risk" value={slaAtRisk.length} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} color="red" />
        </div>

        {/* SLA Breach alert */}
        {slaAtRisk.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              {slaAtRisk.length} request{slaAtRisk.length > 1 ? 's' : ''} approaching SLA deadline
            </div>
            <div className="space-y-1">
              {slaAtRisk.slice(0, 3).map(r => (
                <Link key={r.id} to={`/officer/requests/${r.id}`} className="flex items-center justify-between text-sm text-red-600 hover:text-red-800">
                  <span>{r.request_number} — {r.intent}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Request table */}
        <div className="cf-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Assigned Requests</h2>
            <Link to="/officer/requests" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
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
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-slate-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : requests.slice(0, 10).map(req => (
                      <RequestRow
                        key={req.id}
                        request={req}
                        href={`/officer/requests/${req.id}`}
                        showStudent
                      />
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </OfficerLayout>
  );
}

function StatCard({ label, value, icon, color = 'blue' }: {
  label: string; value: number; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="cf-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
