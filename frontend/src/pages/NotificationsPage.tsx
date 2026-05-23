import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../lib/api';
import type { Notification, PaginatedResponse } from '../types';
import { Loading, Badge, EmptyState } from '../components/ui';

const TYPE_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  low_stock: 'warning', out_of_stock: 'danger', expiry: 'info', system: 'default',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (showUnread) params.unread = 'true';
    api.get<PaginatedResponse<Notification>>('/inventory/notifications/', { params })
      .then(({ data }) => setNotifications(data.results))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [showUnread]);

  const markAllRead = async () => {
    await api.post('/inventory/notifications/mark-read/');
    load();
  };

  const markRead = async (id: number) => {
    await api.post(`/inventory/notifications/${id}/mark-read/`);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">Low stock alerts and system updates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUnread(!showUnread)} className="btn-secondary">
            {showUnread ? 'Show All' : 'Unread Only'}
          </button>
          <button onClick={markAllRead} className="btn-secondary"><CheckCheck className="h-4 w-4" /> Mark All Read</button>
        </div>
      </div>

      {loading ? <Loading /> : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card flex items-start gap-4 transition ${!n.is_read ? 'border-brand-200 dark:border-brand-800' : ''}`}
            >
              <div className={`rounded-full p-2 ${!n.is_read ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{n.title}</h3>
                  <Badge variant={TYPE_VARIANTS[n.notification_type] || 'default'}>{n.notification_type.replace('_', ' ')}</Badge>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="btn-secondary text-xs">Mark read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
