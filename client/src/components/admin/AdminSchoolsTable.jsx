import { useMemo, useState } from 'react';

const PAGE_SIZE = 6;

const AdminSchoolsTable = ({ rows = [], onAddSchool }) => {
  const [sortBy, setSortBy] = useState('students');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const data = [...rows];
    data.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return data;
  }, [rows, sortBy, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeSort = (key) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortDirection('asc');
  };

  return (
    <section className="admin-panel admin-schools-panel">
      <header>
        <h3>Schools</h3>
        <button type="button" onClick={onAddSchool}>+ Add School</button>
      </header>

      {rows.length ? (
        <>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th><button type="button" onClick={() => changeSort('name')}>School Name</button></th>
                  <th><button type="button" onClick={() => changeSort('district')}>District</button></th>
                  <th><button type="button" onClick={() => changeSort('students')}>Students</button></th>
                  <th><button type="button" onClick={() => changeSort('avgSPI')}>Avg SPI</button></th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id || row.name}>
                    <td>{row.name}</td>
                    <td>{row.district}</td>
                    <td>{row.students.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`spi-badge ${row.avgSPI > 700 ? 'good' : row.avgSPI >= 500 ? 'mid' : 'low'}`}>
                        {row.avgSPI}
                      </span>
                    </td>
                    <td><span className={`status-pill ${row.status === 'Active' ? 'ok' : 'warn'}`}>{row.status}</span></td>
                    <td><button type="button" className="arrow-btn">{'->'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>{'<'}</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 12).map((item) => (
              <button
                key={item}
                type="button"
                className={item === page ? 'is-active' : ''}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}
            <button type="button" disabled={page === pageCount} onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}>{'>'}</button>
          </div>
        </>
      ) : (
        <div className="dashboard-empty-state">
          <h4>No school data available</h4>
          <p>Connect the multi-school endpoint to populate this overview table.</p>
          <button type="button" onClick={onAddSchool}>Add first school</button>
        </div>
      )}
    </section>
  );
};

export default AdminSchoolsTable;
