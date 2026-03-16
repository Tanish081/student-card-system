import { useMemo } from 'react';

const toneFor = {
  urgent: 'is-urgent',
  info: 'is-info',
  done: 'is-done'
};

const iconFor = {
  urgent: '!',
  info: 'i',
  done: 'ok'
};

const AdminPendingQueue = ({ items = [], onItemClick }) => {
  const urgentCount = useMemo(() => items.filter((item) => item.tone === 'urgent').length, [items]);

  return (
    <section className="admin-panel admin-queue-panel">
      <header>
        <h3>Requires Action</h3>
        <span className="pulse-badge">{urgentCount}</span>
      </header>

      <div className="admin-queue-list">
        {items.length ? (
          items.map((item) => (
            <button type="button" key={item.id} className="admin-queue-item" onClick={() => onItemClick?.(item)}>
              <span className={`admin-queue-icon ${toneFor[item.tone] || 'is-info'}`}>{iconFor[item.tone] || 'i'}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              <em>{item.action || '->'}</em>
            </button>
          ))
        ) : (
          <div className="dashboard-empty-state small">
            <h4>Queue clear</h4>
            <p>No urgent actions are pending right now.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPendingQueue;
