import { useMemo, useState } from 'react';
import { useAdminSectionData } from '../../../hooks/admin/useAdminSectionData';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const SchemeEligibilitySection = () => {
  const [page, setPage] = useState(1);
  const [schemeName, setSchemeName] = useState('');

  const params = useMemo(() => ({ page, limit: 20, schemeName }), [page, schemeName]);

  const { data, loading, error, refetch } = useAdminSectionData({
    endpoint: '/admin/sections/schemes',
    params,
    cachePrefix: 'admin-schemes',
    ttlMs: 60000
  });

  const rows = data?.rows || [];

  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Scheme Eligibility</h2>
        <select value={schemeName} onChange={(event) => {
          setSchemeName(event.target.value);
          setPage(1);
        }}>
          <option value="">All schemes</option>
          <option value="national">National</option>
          <option value="state">State</option>
        </select>
      </header>

      {loading ? <SectionLoader rows={8} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        !rows.length ? (
          <EmptyState title="No eligibility rows" message="No students match selected scheme filter." />
        ) : (
          <div className="table-wrap card-default">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>School</th>
                  <th>SPI</th>
                  <th>Eligible Schemes</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.uid}>
                    <td>{row.studentName}</td>
                    <td>{row.schoolName}</td>
                    <td>{row.spi}</td>
                    <td>{(row.eligibleSchemes || []).join(', ') || '-'}</td>
                    <td>{new Date(row.updatedAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="pagination-bar">
              <span>{data.count || 0} rows on this page</span>
              <div className="pagination-actions">
                <button type="button" className="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</button>
                <span>{page} / {data.totalPages || 1}</span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setPage((prev) => Math.min(data.totalPages || 1, prev + 1))}
                >
                  Next
                </button>
              </div>
            </footer>
          </div>
        )
      ) : null}
    </section>
  );
};

export default SchemeEligibilitySection;
