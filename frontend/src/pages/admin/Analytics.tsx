import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getDepartmentStats, getSLAPerformance, getResolutionTrend } from '../../services/analytics';
import type { DepartmentStat, TrendData } from '../../types';

export function AdminAnalytics() {
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDepartmentStats(), getResolutionTrend(30)])
      .then(([d, t]) => { setDepartments(d); setTrend(t); })
      .finally(() => setLoading(false));
  }, []);

  const slaData = departments.map(d => ({
    dept: d.department.replace(' Administration', '').substring(0, 8),
    performance: d.sla_performance,
    avg_hours: d.avg_resolution_hours,
    target: d.department === 'Hostel Administration' ? 24 :
            d.department === 'Academic Administration' ? 24 :
            d.department === 'Finance' ? 48 : 48,
  }));

  const avgTimeData = departments.map(d => ({
    dept: d.department.replace(' Administration', ''),
    avg: d.avg_resolution_hours,
  }));

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Detailed performance metrics and insights</p>
        </div>

        {/* Department table */}
        <div className="cf-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Department Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Department', 'Total', 'Pending', 'Resolved', 'Avg Resolution', 'SLA Performance'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map(d => {
                  const sla = d.sla_performance;
                  const slaColor = sla >= 90 ? 'text-emerald-600' : sla >= 80 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <tr key={d.department} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{d.department}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{d.total}</td>
                      <td className="px-4 py-3 text-sm text-amber-600">{d.pending}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">{d.resolved}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{d.avg_resolution_hours}h</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${sla}%`,
                              background: sla >= 90 ? '#22c55e' : sla >= 80 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span className={`text-xs font-semibold ${slaColor}`}>{sla}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-5">
          <div className="cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Average Resolution Time (hours)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}h`, 'Avg Hours']} />
                <Bar dataKey="avg" fill="#0d9488" radius={[4, 4, 0, 0]} name="Avg Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">SLA Performance vs Target</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, '']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="performance" fill="#6366f1" radius={[4, 4, 0, 0]} name="SLA %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-day trend */}
        <div className="cf-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">30-Day Request Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="submitted" fill="#6366f1" radius={[2, 2, 0, 0]} name="Submitted" stackId="a" />
              <Bar dataKey="resolved" fill="#0d9488" radius={[2, 2, 0, 0]} name="Resolved" stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
