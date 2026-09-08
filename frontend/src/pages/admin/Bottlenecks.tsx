import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, TrendingDown, CheckCircle, Lightbulb } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getBottlenecks } from '../../services/analytics';
import type { BottleneckData } from '../../types';

export function AdminBottlenecks() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBottlenecks().then(setBottlenecks).finally(() => setLoading(false));
  }, []);

  const detected = bottlenecks.filter(b => b.is_bottleneck);
  const healthy = bottlenecks.filter(b => !b.is_bottleneck);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bottleneck Detection</h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-assisted operational insights — identifies departments under stress
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="cf-card p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700 text-sm font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              Bottlenecks
            </div>
            <p className="text-3xl font-bold text-red-700">{detected.length}</p>
          </div>
          <div className="cf-card p-4 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold mb-1">
              <CheckCircle className="w-4 h-4" />
              Healthy
            </div>
            <p className="text-3xl font-bold text-emerald-700">{healthy.length}</p>
          </div>
          <div className="cf-card p-4">
            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold mb-1">
              <Clock className="w-4 h-4" />
              Total Pending
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {bottlenecks.reduce((sum, b) => sum + b.pending_requests, 0)}
            </p>
          </div>
        </div>

        {/* Bottleneck cards */}
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Department Status</h2>
          <div className="space-y-4">
            {loading ? (
              Array.from({length:5}).map((_,i)=><div key={i} className="cf-card p-5 animate-pulse h-28" />)
            ) : bottlenecks.map(b => (
              <div
                key={b.department}
                className={`cf-card p-5 ${b.is_bottleneck
                  ? b.severity === 'HIGH' ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'
                  : 'border-emerald-200 bg-emerald-50/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{b.department}</h3>
                      {b.is_bottleneck ? (
                        <span className={`badge ${b.severity === 'HIGH' ? 'badge-critical' : 'badge-medium'}`}>
                          ⚠ Bottleneck — {b.severity}
                        </span>
                      ) : (
                        <span className="badge badge-resolved">✓ Healthy</span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <Metric label="Avg Resolution" value={`${b.avg_resolution_hours}h`}
                        highlight={b.avg_resolution_hours > b.target_sla_hours} />
                      <Metric label="Target SLA" value={`${b.target_sla_hours}h`} />
                      <Metric label="SLA Performance" value={`${b.sla_performance}%`}
                        highlight={b.sla_performance < 85} />
                      <Metric label="Pending" value={b.pending_requests.toString()}
                        highlight={b.pending_requests > 10} />
                    </div>

                    {/* SLA performance bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${b.sla_performance}%`,
                            background: b.sla_performance >= 90 ? '#22c55e' : b.sla_performance >= 80 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{b.sla_performance}% SLA met</span>
                    </div>

                    {/* AI Recommendation */}
                    {b.is_bottleneck && (
                      <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg flex gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-0.5">AI-Assisted Recommendation</p>
                          <p className="text-xs text-slate-600">{b.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-red-600' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
