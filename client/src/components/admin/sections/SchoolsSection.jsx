import { useNavigate } from 'react-router-dom';
import { useSchoolsSection } from '../../../hooks/admin/useSchoolsSection';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const SchoolsSection = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useSchoolsSection();
  const rows = data?.schools || [];

  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Schools</h2>
        <button type="button">+ Add School</button>
      </header>

      {loading ? <SectionLoader rows={8} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        !rows.length ? (
          <EmptyState title="No schools found" message="No school records are available yet." />
        ) : (
          <div className="table-wrap card-default">
            <table>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>District</th>
                  <th>Students</th>
                  <th>Avg SPI</th>
                  <th>Verified %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} onClick={() => navigate(`/admin/schools/${row.id}`)}>
                    <td>{row.schoolName}</td>
                    <td>{row.district}</td>
                    <td>{row.students}</td>
                    <td>{row.avgSPI}</td>
                    <td>{row.verifiedPercent}%</td>
                    <td>{row.status}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="secondary">Open</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
};

export default SchoolsSection;
