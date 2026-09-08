import api from './api';
import type { Notification } from '../types';

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/api/notifications');
  return data;
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/api/notifications/read-all');
}
