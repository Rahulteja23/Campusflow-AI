import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { listRequests } from '../../services/requests';
import { SLACountdown } from '../../components/SLACountdown';
import { getSLAStatus } from '../../services/requests';
import { getSLAColorClass } from '../../hooks/useSLA';
import { priorityClass, statusClass, statusLabel } from '../../utils';
import type { Request, SLAStatus } from '../../types';

export function AdminSLA() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [slaMap, setSlaMap] = useState<Record<string, SLAStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRequests().then(async (reqs) => {
      const active = reqs.filter(r => !['RESOLVED', 'REJECTED'].includes(r.status) && r.sla_deadline);
      setRequests(active);

      // Fetch SLA status for each
      const slaResults = await Promise.allSettled(
        active.slice(0, 20).map(r => getSLAStatus(r.id).then(s => [r.id, s] as [string, SLAStatus]))
      );
      const map: Record<string, SLAStatus> = {};
      for (const result of slaResults) {
        if (result.status === 'fulfilled') {
          const [id, sla] = result.value;
          map[id] = sla;
        }
      }
      setSlaMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const breached = requests.filter(r => slaMap[r.id]?.is_breached);
  const warning = requests.filter(r => slaMap[r.id]?.is_warning && !slaMap[r.id]?.is_breached);
  const onTrack = requests.filter(r => slaMap[r.id]?.status === 'ON_TRACK');

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SLA Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time SLA status for all active requests</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="cf-card p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700 text-sm font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" /> SLA Breached
            </div>
            <p className="text-3xl font-bold text-red-700">{breached.length}</p>
          </div>
          <div className="cf-card p-4 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-1">
              <Activity className="w-4 h-4" /> Warning
            </div>
            <p className="text-3xl font-bold text-amber-700">{warning.length}</p>
          </div>
          <div className="cf-card p-4 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold mb-1">
              <CheckCircle className="w-4 h-4" /> On Track
            </div>
            <p className="text-3xl font-bold text-emerald-700">{onTrack.length}</p>
          </div>
        </div>

        {/* Breached alerts */}
        {breached.length > 0 && (
          <div className="cf-card border-red-200 overflow-hidden">
            <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-red-700 text-sm">SLA Breached — Immediate Action Required</h3>
            </div>
            <div className="divide-y divide-red-100">
              {breached.map(req => (
                <div key={req.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">{req.request_number}</span>
                        {req.priority && <span className={priorityClass(req.priority)}>{req.priority}</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-1">{req.intent || req.description.slice(0, 60)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{req.department}</p>
                    </div>
                    {slaMap[req.id] && (
                      <div className="w-48 flex-shrink-0">
                        <SLACountdown sla={slaMap[req.id]} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All active requests */}
        <div className="cf-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Active Requests — SLA Status</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="px-5 py-4 animate-pulse"><div className="h-3 bg-slate-100 rounded w-2/3" /></div>
                ))
              : requests.map(req => {
                  const sla = slaMap[req.id];
                  return (
                    <div key={req.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{req.request_number}</span>
                          {req.priority && <span className={priorityClass(req.priority)}>{req.priority}</span>}
                          <span className={statusClass(req.status)}>{statusLabel(req.status)}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-0.5">{req.intent}</p>
                        <p className="text-xs text-slate-400">{req.department}</p>
                      </div>
                      {sla && (
                        <div className="w-64 flex-shrink-0">
                          <SLACountdown sla={sla} />
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
