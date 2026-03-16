import { useState } from 'react';

const AdminAuditStrip = ({ logs = [], total = 0 }) => {
  const [open, setOpen] = useState(false);

  return (
    <section className={`admin-audit-strip ${open ? 'is-open' : ''}`}>
      <button type="button" className="admin-audit-toggle" onClick={() => setOpen((prev) => !prev)}>
        <span>AUDIT LOG</span>
        <p>Last entry: {logs[0] ? new Date(logs[0].eventTimestamp || logs[0].createdAt).toLocaleTimeString('en-IN') : 'N/A'} · {total.toLocaleString('en-IN')} total entries</p>
        <em>{open ? 'v' : '^'}</em>
      </button>

      {open ? (
        <div className="admin-audit-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log) => (
                <tr key={log._id || `${log.action}-${log.createdAt}`}>
                  <td>{new Date(log.eventTimestamp || log.createdAt).toLocaleString('en-IN')}</td>
                  <td>{log.actorName || log.actorId || 'system'}</td>
                  <td>{log.action}</td>
                  <td>{log.entityType}</td>
                  <td>{(log.currentHash || '-').slice(0, 18)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default AdminAuditStrip;
