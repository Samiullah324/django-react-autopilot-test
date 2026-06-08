import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api/client';
import type { Notification } from '../types';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = async () => {
    const res = await api.notifications();
    setNotifications(res.results);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: number) => {
    await api.markNotificationRead(id);
    load();
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    load();
  };

  const tone = (type: string) => {
    if (type === 'out_of_stock') return 'badge-danger';
    if (type === 'low_stock') return 'badge-warning';
    if (type === 'expiry') return 'badge-warning';
    return 'badge-neutral';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Low stock, expiry, and system alerts</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead}>
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={32} className="empty-state-icon" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="timeline">
              {notifications.map((n) => (
                <div key={n.id} className={`timeline-item ${n.is_read ? 'timeline-item--muted' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>{n.title}</h4>
                      <span className={`badge ${tone(n.notification_type)}`}>{n.notification_type.replace('_', ' ')}</span>
                    </div>
                    <p>{n.message}</p>
                    <small className="timeline-meta">{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                  {!n.is_read && (
                    <button className="btn btn-secondary" onClick={() => markRead(n.id)}>Mark read</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
