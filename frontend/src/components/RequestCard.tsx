import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { Request } from '../types';
import { priorityClass, statusClass, statusLabel, timeAgo } from '../utils';

interface RequestCardProps {
  request: Request;
  href: string;
  showStudent?: boolean;
}

export function RequestCard({ request, href, showStudent = false }: RequestCardProps) {
  return (
    <Link to={href} className="block cf-card-hover p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Request number + priority */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400 font-semibold">{request.request_number}</span>
            {request.priority && (
              <span className={priorityClass(request.priority)}>
                {request.priority}
              </span>
            )}
          </div>

          {/* Intent / description */}
          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
            {request.intent || request.description.slice(0, 60)}
          </p>

          {showStudent && request.student_name && (
            <p className="text-xs text-slate-500 mt-0.5">{request.student_name}</p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {request.department && (
              <span className="text-xs text-slate-500">{request.department}</span>
            )}
            <span className={statusClass(request.status)}>
              {statusLabel(request.status)}
            </span>
          </div>
        </div>

        {/* Right: SLA + time */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {timeAgo(request.updated_at)}
          </div>
          {request.sla_hours && (
            <div className="text-xs text-slate-400 mt-1">
              {request.sla_hours}h SLA
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Table row variant for officer/admin views
interface RequestRowProps {
  request: Request;
  href: string;
  showStudent?: boolean;
}

export function RequestRow({ request, href, showStudent = false }: RequestRowProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors cursor-pointer group">
      <td className="px-4 py-3">
        <Link to={href} className="block">
          <span className="text-xs font-mono font-semibold text-slate-600">{request.request_number}</span>
        </Link>
      </td>
      {showStudent && (
        <td className="px-4 py-3 text-sm text-slate-700">{request.student_name || '—'}</td>
      )}
      <td className="px-4 py-3">
        <Link to={href}>
          <p className="text-sm font-medium text-slate-800 max-w-[200px] truncate group-hover:text-teal-700">
            {request.intent || request.description.slice(0, 40)}
          </p>
          <p className="text-xs text-slate-400">{request.department}</p>
        </Link>
      </td>
      <td className="px-4 py-3">
        {request.priority && (
          <span className={priorityClass(request.priority)}>{request.priority}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={statusClass(request.status)}>{statusLabel(request.status)}</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(request.created_at)}</td>
      <td className="px-4 py-3">
        <Link to={href} className="btn-ghost text-xs py-1 px-2">View →</Link>
      </td>
    </tr>
  );
}
