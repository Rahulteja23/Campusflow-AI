import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Activity, ArrowRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getOverview, getDepartmentStats, getPriorityBreakdown, getResolutionTrend } from '../../services/analytics';
import { checkAndEscalate } from '../../services/requests';
import { getDepartmentColor } from '../../utils';
import type { AnalyticsOverview, DepartmentStat, TrendData } from '../../types';

export function AdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState(false);
  const [escalateResult, setEscalateResult] = useState<string>('');

  useEffect(() => {
    Promise.all([
      getOverview(), getDepartmentStats(), getPriorityBreakdown(), getResolutionTrend(14)
    ]).then(([ov, depts, prio, tr]) => {
      setOverview(ov); setDepartments(depts);
      setPriorities(prio); setTrend(tr);
    }).finally(() => setLoading(false));
  }, []);

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const result: any = await checkAndEscalate();
      setEscalateResult(`✓ Escalated ${result.escalated_count} SLA-breached requests`);
    } catch {
      setEscalateResult('Escalation check complete');
    } finally {
      setEscalating(false);
    }
  };

  const priorityData = [
    { name: 'Critical', value: priorities['CRITICAL'] || 0, color: '#ef4444' },
    { name: 'High', value: priorities['HIGH'] || 0, color: '#f97316' },
    { name: 'Medium', value: priorities['MEDIUM'] || 0, color: '#f59e0b' },
    { name: 'Low', value: priorities['LOW'] || 0, color: '#94a3b8' },
  ];

  const deptChartData = departments.map(d => ({
    name: d.department.replace(' Administration', '').replace('Academic', 'Academic'),
    total: d.total,
    pending: d.pending,
    resolved: d.resolved,
  }));

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">CampusFlow AI — System Overview</p>
          </div>
          <div className="flex items-center gap-3">
            {escalateResult && (
              <span className="text-xs text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">{escalateResult}</span>
            )}
            <button
              id="escalate-sla-btn"
              onClick={handleEscalate}
              disabled={escalating}
              className="btn-secondary text-sm"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              {escalating ? 'Checking...' : 'Check SLA & Escalate'}
            </button>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            Array.from({length:6}).map((_,i)=><div key={i} className="cf-card p-4 animate-pulse h-20" />)
          ) : overview && [
            { label: 'Total', value: overview.total, icon: FileText, color: 'text-blue-500' },
            { label: 'Pending', value: overview.pending, icon: Clock, color: 'text-amber-500' },
            { label: 'High Priority', value: overview.high_priority, icon: AlertTriangle, color: 'text-orange-500' },
            { label: 'SLA Breaches', value: overview.sla_breaches, icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Escalated', value: overview.escalated, icon: TrendingUp, color: 'text-violet-500' },
            { label: 'Resolved', value: overview.resolved, icon: CheckCircle, color: 'text-emerald-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="cf-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Resolution trend */}
          <div className="col-span-2 cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Resolution Trend (14 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="submitted" stroke="#6366f1" fill="url(#gradSubmitted)" strokeWidth={2} name="Submitted" />
                <Area type="monotone" dataKey="resolved" stroke="#0d9488" fill="url(#gradResolved)" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Priority pie */}
          <div className="cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">By Priority</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-600">{p.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department stats */}
        <div className="grid grid-cols-2 gap-5">
          <div className="cf-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Requests by Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} name="Total" />
                <Bar dataKey="resolved" fill="#0d9488" radius={[0, 4, 4, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SLA performance table */}
          <div className="cf-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">SLA Performance</h3>
              <Link to="/admin/analytics" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Full report <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {departments.map(d => {
                const perf = d.sla_performance;
                const color = perf >= 90 ? '#22c55e' : perf >= 80 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={d.department}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 truncate">{d.department.replace(' Administration', '')}</span>
                      <span className="font-semibold" style={{ color }}>{perf}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${perf}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { to: '/admin/requests', label: 'All Requests', desc: 'View and manage every request', icon: FileText },
            { to: '/admin/bottlenecks', label: 'Bottleneck Detection', desc: 'AI-assisted operational insights', icon: Activity },
            { to: '/admin/audit', label: 'Audit History', desc: 'Full transparent audit trail', icon: Clock },
          ].map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to} className="cf-card-hover p-4 group">
              <Icon className="w-5 h-5 text-teal-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
