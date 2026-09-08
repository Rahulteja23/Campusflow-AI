import { useState, useEffect } from 'react';
import { ClipboardList, Filter } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getAllAuditLogs } from '../../services/requests';
import { formatDateTime } from '../../utils';
import type { AuditLog } from '../../types';

const ACTOR_COLORS: Record<string, string> = {
  AI_SYSTEM: 'bg-violet-100 text-violet-700',
  SYSTEM: 'bg-slate-100 text-slate-600',
  STUDENT: 'bg-blue-100 text-blue-700',
  OFFICER: 'bg-teal-100 text-teal-700',
  ADMIN: 'bg-orange-100 text-orange-700',
};

export function AdminAuditHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getAllAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? logs.filter(l => l.actor_type.includes(filter) || l.action.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit History</h1>
          <p className="text-slate-500 text-sm mt-1">Complete transparent action log — every system event recorded</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by actor or action..."
              className="cf-input pl-8 text-sm py-2 w-64"
            />
          </div>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>

        <div className="cf-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Timestamp', 'Actor', 'Action', 'Request', 'Status Change', 'Comments'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? Array.from({length:10}).map((_,i)=>(
                    <tr key={i}>{Array.from({length:6}).map((_,j)=>(
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                : filtered.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 text-sm">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${ACTOR_COLORS[log.actor_type] || 'bg-slate-100 text-slate-600'}`}>
                          {log.actor_name || log.actor_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{log.action}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">
                        {log.request_id?.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        {(log.old_status || log.new_status) && (
                          <div className="flex items-center gap-1.5 text-xs">
                            {log.old_status && <span className="text-slate-400">{log.old_status}</span>}
                            {log.old_status && log.new_status && <span className="text-slate-300">→</span>}
                            {log.new_status && <span className="font-medium text-slate-700">{log.new_status}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                        {log.comments || '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
