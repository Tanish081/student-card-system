import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import StudentIDCard from '../../StudentIDCard';
import { useStudentDetail, useStudentsSection } from '../../../hooks/admin/useStudentsSection';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const DEFAULT_FILTERS = {
  school: '',
  status: '',
  spiMin: '',
  spiMax: ''
};

const StudentsSection = ({ context }) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('spiTotal');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedUID, setSelectedUID] = useState('');
  const [drawerTab, setDrawerTab] = useState('profile');

  const deferredSearch = useDeferredValue(searchQuery);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: deferredSearch,
      sortBy,
      sortOrder,
      ...filters
    }),
    [deferredSearch, filters, page, sortBy, sortOrder]
  );

  const { data, loading, error, refetch } = useStudentsSection(params);
  const detail = useStudentDetail(selectedUID);

  const rows = data?.students || [];

  const toggleSort = (nextSortBy) => {
    if (sortBy === nextSortBy) {
      setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(nextSortBy);
    setSortOrder(nextSortBy === 'name' ? 'asc' : 'desc');
  };

  const exportCsv = () => {
    const header = ['Name', 'UID', 'School', 'Class', 'SPI', 'Status'];
    const lines = rows.map((row) => [
      row.name,
      row.uid,
      row.schoolId,
      `${row.class}${row.section}`,
      row.spiTotal,
      row.eligibilityFlags?.some((item) => item.eligible) ? 'Eligible' : 'Review'
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (context?.action === 'export' && rows.length) {
      exportCsv();
    }
  }, [context?.action, rows.length]);

  return (
    <section className="section-content students-section">
      <header className="section-header card-default">
        <div>
          <h2>Students</h2>
          <p>Showing paginated student records with sortable SPI and searchable UIDs.</p>
        </div>
        <div className="section-header-actions">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or UID"
          />
          <button type="button" onClick={exportCsv}>Export CSV</button>
        </div>
      </header>

      <div className="filter-row card-muted">
        <select value={filters.school} onChange={(event) => setFilters((prev) => ({ ...prev, school: event.target.value }))}>
          <option value="">All Schools</option>
          <option value="SCH001">SCH001</option>
        </select>
        <select value={filters.spiMin} onChange={(event) => setFilters((prev) => ({ ...prev, spiMin: event.target.value }))}>
          <option value="">All SPI ranges</option>
          <option value="0">0+</option>
          <option value="300">300+</option>
          <option value="600">600+</option>
          <option value="800">800+</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
          <option value="">All Status</option>
          <option value="eligible">Eligible</option>
          <option value="ineligible">Ineligible</option>
        </select>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setFilters(DEFAULT_FILTERS);
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>

      {loading ? <SectionLoader rows={8} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        <>
          {!rows.length ? (
            <EmptyState title="No students found" message="No rows match the selected filters." />
          ) : (
            <div className="table-wrap card-default">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" onClick={() => toggleSort('name')}>Name</button>
                    </th>
                    <th>UID</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>
                      <button type="button" onClick={() => toggleSort('spiTotal')}>SPI</button>
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const status = row.eligibilityFlags?.some((item) => item.eligible) ? 'Eligible' : 'Review';
                    return (
                      <tr key={row.uid} onClick={() => setSelectedUID(row.uid)}>
                        <td>{row.name}</td>
                        <td>{row.uid}</td>
                        <td>{row.schoolId}</td>
                        <td>{row.class}{row.section}</td>
                        <td>{Number(row.spiTotal || 0).toLocaleString('en-IN')}</td>
                        <td>{status}</td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="secondary" onClick={(event) => {
                              event.stopPropagation();
                              setSelectedUID(row.uid);
                            }}>
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <footer className="pagination-bar">
                <div>
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total || 0)} of {data.total || 0}
                </div>
                <div className="pagination-actions">
                  <button type="button" className="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                    Prev
                  </button>
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
          )}
        </>
      ) : null}

      {selectedUID ? (
        <div className="drawer-backdrop" onClick={() => setSelectedUID('')}>
          <aside className="student-drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Student Detail</h3>
              <button type="button" className="secondary" onClick={() => setSelectedUID('')}>Close</button>
            </header>

            <nav className="drawer-tabs">
              {['profile', 'achievements', 'eligibility', 'audit'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={drawerTab === tab ? 'is-active' : ''}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {detail.loading ? <SectionLoader rows={4} /> : null}
            {detail.error ? <ErrorState message={detail.error} retry={detail.refetch} /> : null}

            {!detail.loading && !detail.error && detail.data ? (
              <div className="drawer-content">
                {drawerTab === 'profile' ? (
                  <StudentIDCard
                    profile={detail.data.student}
                    spi={{ spiTotal: detail.data.student.spiTotal || 0, spi: Math.round((detail.data.student.spiTotal || 0) / 10) }}
                  />
                ) : null}

                {drawerTab === 'achievements' ? (
                  <ul className="drawer-list">
                    {(detail.data.achievements || []).map((item) => (
                      <li key={item._id}>{item.eventName} · {item.status}</li>
                    ))}
                  </ul>
                ) : null}

                {drawerTab === 'eligibility' ? (
                  <ul className="drawer-list">
                    {(detail.data.eligibility || []).map((item, index) => (
                      <li key={`${item.schemeId || 'scheme'}-${index}`}>
                        {item.schemeName || 'Scheme'} · {item.eligible ? 'Eligible' : 'Not eligible'}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {drawerTab === 'audit' ? (
                  <ul className="drawer-list">
                    {(detail.data.auditTrail || []).map((item) => (
                      <li key={item._id}>{item.action} · {new Date(item.eventTimestamp || item.createdAt).toLocaleString('en-IN')}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default StudentsSection;
