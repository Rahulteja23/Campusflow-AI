import { useState, useEffect, useCallback } from 'react';
import type { SLAStatus } from '../types';
import { getSLAStatus } from '../services/requests';

export function useSLA(requestId: string | undefined, refreshInterval = 30000) {
  const [sla, setSLA] = useState<SLAStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const data = await getSLAStatus(requestId);
      setSLA(data);
    } catch {
      // silently fail for SLA
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [fetch, refreshInterval]);

  return { sla, loading, refresh: fetch };
}

/**
 * Formats remaining time as "18h 42m" or "2m 15s"
 */
export function formatSLATime(minutes: number): string {
  if (minutes <= 0) return 'Overdue';
  if (minutes < 60) {
    const m = Math.floor(minutes);
    const s = Math.floor((minutes - m) * 60);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
}

export function getSLAColorClass(status: SLAStatus['status']): string {
  switch (status) {
    case 'ON_TRACK': return 'text-emerald-600';
    case 'WARNING': return 'text-amber-600';
    case 'BREACHED': return 'text-red-600';
    default: return 'text-slate-400';
  }
}

export function getSLAProgressColor(status: SLAStatus['status']): string {
  switch (status) {
    case 'ON_TRACK': return 'bg-emerald-500';
    case 'WARNING': return 'bg-amber-500';
    case 'BREACHED': return 'bg-red-500';
    default: return 'bg-slate-300';
  }
}
