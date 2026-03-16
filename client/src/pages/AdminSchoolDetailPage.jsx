import { Link, useParams } from 'react-router-dom';
import { useSchoolsSection } from '../hooks/admin/useSchoolsSection';
import SectionLoader from '../components/shared/SectionLoader';
import ErrorState from '../components/shared/ErrorState';

const AdminSchoolDetailPage = () => {
  const { id } = useParams();
  const { data, loading, error, refetch } = useSchoolsSection();

  const school = (data?.schools || []).find((item) => item.id === id);

  return (
    <main className="admin-school-detail">
      <Link to="/admin" className="back-link">Back to admin dashboard</Link>

      {loading ? <SectionLoader rows={5} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error && school ? (
        <section className="card-default">
          <h1>{school.schoolName}</h1>
          <p>District: {school.district}</p>
          <p>Students: {school.students}</p>
          <p>Average SPI: {school.avgSPI}</p>
          <p>Verification Rate: {school.verifiedPercent}%</p>
          <p>Status: {school.status}</p>
        </section>
      ) : null}
    </main>
  );
};

export default AdminSchoolDetailPage;
