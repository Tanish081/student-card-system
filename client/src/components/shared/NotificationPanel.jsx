import { useMemo } from 'react';

const bucketNotifications = (notifications = []) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  return notifications.reduce(
    (acc, item) => {
      const time = new Date(item.createdAt || item.timestamp || Date.now()).getTime();
      if (now - time <= day) {
        acc.today.push(item);
      } else if (now - time <= week) {
        acc.week.push(item);
      } else {
        acc.earlier.push(item);
      }
      return acc;
    },
    { today: [], week: [], earlier: [] }
  );
};

const NotificationGroup = ({ title, data, onItemClick }) => (
  <section className="dashboard-notification-group">
    <h4>{title}</h4>
    {data.length ? (
      data.map((item) => (
        <button
          type="button"
          className={`dashboard-notification-item ${item.isRead ? '' : 'is-unread'}`}
          key={item.id || item._id || `${item.title}-${item.createdAt}`}
          onClick={() => onItemClick?.(item)}
        >
          <p>{item.title || item.message || 'Notification'}</p>
          <span>{new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString('en-IN')}</span>
        </button>
      ))
    ) : (
      <div className="dashboard-empty-inline">No items</div>
    )}
  </section>
);

const NotificationPanel = ({
  open,
  title = 'Notifications',
  notifications = [],
  onClose,
  onMarkAllRead,
  onItemClick
}) => {
  const groups = useMemo(() => bucketNotifications(notifications), [notifications]);

  return (
    <>
      <div className={`dashboard-notification-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`dashboard-notification-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <header>
          <h3>{title}</h3>
          <div>
            <button type="button" onClick={onMarkAllRead}>Mark all read</button>
            <button type="button" onClick={onClose} aria-label="Close notifications">x</button>
          </div>
        </header>

        <NotificationGroup title="Today" data={groups.today} onItemClick={onItemClick} />
        <NotificationGroup title="This week" data={groups.week} onItemClick={onItemClick} />
        <NotificationGroup title="Earlier" data={groups.earlier} onItemClick={onItemClick} />
      </aside>
    </>
  );
};

export default NotificationPanel;
