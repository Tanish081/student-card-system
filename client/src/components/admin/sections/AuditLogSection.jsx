import { Fragment, useMemo, useState } from 'react';
import { useAdminSectionData } from '../../../hooks/admin/useAdminSectionData';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const AuditLogSection = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', actor: '', action: '' });
  const [expandedId, setExpandedId] = useState('');

  const params = useMemo(() => ({ page, limit: 20, ...filters }), [filters, page]);

  const { data, loading, error, refetch } = useAdminSectionData({
    endpoint: '/admin/sections/audit',
    params,
    cachePrefix: 'admin-audit',
    ttlMs: 30000
  });

  const logs = data?.logs || [];

  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Audit Log</h2>
      </header>

      <div className="filter-row card-muted">
        <input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} />
        <input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} />
        <input placeholder="Actor" value={filters.actor} onChange={(event) => setFilters((prev) => ({ ...prev, actor: event.target.value }))} />
        <input placeholder="Action" value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))} />
      </div>

      {loading ? <SectionLoader rows={8} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        !logs.length ? (
          <EmptyState title="No audit events" message="No logs match the selected filters." />
        ) : (
          <div className="table-wrap card-default">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <Fragment key={row._id}>
                    <tr key={row._id}>
                      <td>{new Date(row.eventTimestamp || row.createdAt).toLocaleString('en-IN')}</td>
                      <td>{row.performedByName}</td>
                      <td>{row.action}</td>
                      <td>{row.entityType}:{row.entityId}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setExpandedId((prev) => (prev === row._id ? '' : row._id))}
                        >
                          {expandedId === row._id ? 'Hide' : 'Expand'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === row._id ? (
                      <tr key={`${row._id}-details`}>
                        <td colSpan={5}>
                          <div className="audit-diff-grid">
                            <pre>{JSON.stringify(row.beforeState || {}, null, 2)}</pre>
                            <pre>{JSON.stringify(row.afterState || row.metadata || {}, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <footer className="pagination-bar">
              <span>Total {data.total || 0}</span>
              <div className="pagination-actions">
                <button type="button" className="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</button>
                <span>{page} / {data.totalPages || 1}</span>
                <button type="button" className="secondary" onClick={() => setPage((prev) => Math.min(data.totalPages || 1, prev + 1))}>Next</button>
              </div>
            </footer>
          </div>
        )
      ) : null}
    </section>
  );
};

export default AuditLogSection;
