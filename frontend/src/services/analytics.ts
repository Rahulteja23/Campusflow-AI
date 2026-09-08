import api from './api';
import type { AnalyticsOverview, DepartmentStat, BottleneckData, TrendData } from '../types';

export async function getOverview(): Promise<AnalyticsOverview> {
  const { data } = await api.get<AnalyticsOverview>('/api/analytics/overview');
  return data;
}

export async function getDepartmentStats(): Promise<DepartmentStat[]> {
  const { data } = await api.get<DepartmentStat[]>('/api/analytics/departments');
  return data;
}

export async function getPriorityBreakdown(): Promise<Record<string, number>> {
  const { data } = await api.get<Record<string, number>>('/api/analytics/priorities');
  return data;
}

export async function getSLAPerformance(): Promise<DepartmentStat[]> {
  const { data } = await api.get<DepartmentStat[]>('/api/analytics/sla');
  return data;
}

export async function getBottlenecks(): Promise<BottleneckData[]> {
  const { data } = await api.get<BottleneckData[]>('/api/analytics/bottlenecks');
  return data;
}

export async function getResolutionTrend(days = 30): Promise<TrendData[]> {
  const { data } = await api.get<TrendData[]>('/api/analytics/trends', { params: { days } });
  return data;
}
