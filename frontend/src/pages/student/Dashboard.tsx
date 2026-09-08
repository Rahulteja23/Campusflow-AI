import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Clock, CheckCircle, AlertTriangle, TrendingUp,
  FileText, ArrowRight, Activity, Zap
} from 'lucide-react';
import { StudentLayout } from '../../layouts/StudentLayout';
import { useAuth } from '../../hooks/useAuth';
import { listRequests } from '../../services/requests';
import { RequestCard } from '../../components/RequestCard';
import type { Request } from '../../types';
import { statusLabel } from '../../utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  const active = requests.filter(r => !['RESOLVED', 'REJECTED'].includes(r.status));
  const pending = requests.filter(r => ['PENDING_APPROVAL', 'IN_PROGRESS', 'ROUTED'].includes(r.status));
  const resolved = requests.filter(r => r.status === 'RESOLVED');
  const highPriority = requests.filter(r => ['HIGH', 'CRITICAL'].includes(r.priority || ''));

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Here's an overview of your service requests
            </p>
          </div>
          <Link to="/student/submit" id="new-request-btn" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Submit New Request
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active Requests"
            value={active.length}
            icon={<Activity className="w-5 h-5 text-blue-500" />}
            color="blue"
          />
          <StatCard
            label="Pending"
            value={pending.length}
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            color="amber"
          />
          <StatCard
            label="Resolved"
            value={resolved.length}
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
            color="emerald"
          />
          <StatCard
            label="High Priority"
            value={highPriority.length}
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            color="orange"
          />
        </div>

        {/* CTA Banner — if no requests */}
        {!loading && requests.length === 0 && (
          <div className="cf-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">No requests yet</h2>
            <p className="text-slate-500 text-sm mt-1 mb-4">
              Submit your first request in natural language — AI will handle the rest
            </p>
            <Link to="/student/submit" className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Submit Request
            </Link>
          </div>
        )}

        {/* Recent requests */}
        {requests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800">Recent Requests</h2>
              <Link to="/student/requests" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="cf-card p-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))
                : requests.slice(0, 5).map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      href={`/student/requests/${req.id}`}
                    />
                  ))
              }
            </div>
          </div>
        )}

        {/* How CampusFlow AI works */}
        <div className="cf-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            How CampusFlow AI Works
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { icon: '💬', label: 'You describe your need' },
              { icon: '🤖', label: 'AI understands & classifies' },
              { icon: '📋', label: 'Workflow auto-created' },
              { icon: '⏱️', label: 'SLA monitored' },
              { icon: '✅', label: 'Resolved & notified' },
            ].map(({ icon, label }, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
                {i < 4 && (
                  <div className="hidden sm:flex justify-end -mr-4 -mt-5 items-center">
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
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
