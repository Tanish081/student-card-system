import { useState } from 'react';
import useLiveActivity from '../../hooks/useLiveActivity';

const typeClass = {
  VERIFY: 'is-verify',
  APPLY: 'is-apply',
  SCHEME: 'is-scheme',
  AUDIT: 'is-audit',
  'QR SCAN': 'is-qr'
};

const AdminActivityFeed = ({ events = [] }) => {
  const { items, isAnimating } = useLiveActivity(events, {
    maxItems: 12,
    intervalMin: 8000,
    intervalMax: 12000,
    autoStart: true
  });
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="admin-panel admin-activity-panel">
      <header>
        <h3>Live Activity</h3>
        <p><span /> live stream</p>
      </header>

      <div className={`admin-activity-list ${isAnimating ? 'is-animating' : ''}`}>
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="admin-activity-item">
              <button
                type="button"
                className="admin-activity-row"
                onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
              >
                <span className={`admin-activity-type ${typeClass[item.type] || 'is-audit'}`}>{item.type}</span>
                <span className="admin-activity-text">{item.text}</span>
                <span className="admin-activity-time">{item.time}</span>
              </button>
              {expandedId === item.id ? <p className="admin-activity-detail">{item.detail}</p> : null}
            </article>
          ))
        ) : (
          <div className="dashboard-empty-state small">
            <h4>No activity yet</h4>
            <p>New verification and audit events will stream here.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminActivityFeed;
