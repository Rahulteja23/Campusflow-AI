import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { StudentLayout } from '../../layouts/StudentLayout';
import { getNotifications, markRead, markAllRead } from '../../services/notifications';
import { timeAgo } from '../../utils';
import type { Notification } from '../../types';

const TYPE_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-600',
  ROUTED: 'bg-violet-100 text-violet-600',
  APPROVED: 'bg-emerald-100 text-emerald-600',
  REJECTED: 'bg-red-100 text-red-600',
  RESOLVED: 'bg-teal-100 text-teal-600',
  ESCALATED: 'bg-orange-100 text-orange-600',
  SLA_WARNING: 'bg-amber-100 text-amber-600',
};

export function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then(setNotifications).finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <StudentLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-ghost text-xs">
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cf-card p-4 animate-pulse h-16" />
            ))
          ) : notifications.length === 0 ? (
            <div className="cf-card p-8 text-center">
              <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`cf-card p-4 cursor-pointer transition-all ${!notif.read ? 'border-teal-200 bg-teal-50/30' : ''}`}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[notif.notification_type || ''] || 'bg-slate-100 text-slate-500'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
