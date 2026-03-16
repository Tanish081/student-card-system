import { useEffect, useState } from 'react';
import api from '../services/api';

const NotificationsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/notifications/me', {
        params: { limit: 10 }
      });
      const payload = response.data.data || {};
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/me/${id}/read`);
      await loadNotifications();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/me/read-all');
      await loadNotifications();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to mark all notifications as read');
    }
  };

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Notifications ({unreadCount} unread)</h3>
        <button type="button" className="secondary" onClick={markAllRead} disabled={!unreadCount || loading}>
          Mark all read
        </button>
      </div>

      {loading ? <p>Loading notifications...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {!loading && !error && !notifications.length ? <p>No notifications yet.</p> : null}

      {!loading && !error && notifications.length ? (
        <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.55rem' }}>
          {notifications.map((item) => (
            <li
              key={item._id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '0.6rem',
                background: item.isRead ? '#ffffff' : '#eff6ff'
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
              <p style={{ margin: '0.25rem 0 0.45rem', color: '#475569' }}>{item.message}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: '#64748b' }}>{new Date(item.createdAt).toLocaleString()}</small>
                {!item.isRead ? (
                  <button type="button" className="secondary" onClick={() => markOneRead(item._id)}>
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default NotificationsPanel;
