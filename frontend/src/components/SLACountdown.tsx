import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { SLAStatus } from '../types';
import { formatSLATime, getSLAColorClass, getSLAProgressColor } from '../hooks/useSLA';

interface SLACountdownProps {
  sla: SLAStatus;
  compact?: boolean;
}

export function SLACountdown({ sla, compact = false }: SLACountdownProps) {
  const colorClass = getSLAColorClass(sla.status);
  const progressColor = getSLAProgressColor(sla.status);
  const progressWidth = Math.min(sla.percentage_elapsed, 100);

  const Icon = sla.is_breached ? AlertTriangle : sla.is_warning ? Clock : CheckCircle;

  if (compact) {
    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {sla.is_breached
          ? 'SLA Breached'
          : sla.minutes_remaining != null
          ? formatSLATime(sla.minutes_remaining)
          : '--'}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${colorClass}`}>
          <Icon className="w-4 h-4" />
          <span>
            {sla.is_breached
              ? 'SLA Breached'
              : sla.minutes_remaining != null
              ? `${formatSLATime(sla.minutes_remaining)} remaining`
              : 'SLA Unknown'}
          </span>
        </div>
        <span className="text-xs text-slate-500">{sla.sla_hours}h SLA</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{progressWidth.toFixed(0)}% elapsed</span>
        {sla.sla_deadline && (
          <span>Deadline: {new Date(sla.sla_deadline).toLocaleString('en-IN', {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
          })}</span>
        )}
      </div>
    </div>
  );
}
