import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import OpportunityCreateForm from '../components/OpportunityCreateForm';
import OpportunityApplicationsReview from '../components/OpportunityApplicationsReview';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/principal/analytics');
        setAnalytics(response.data.data);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load analytics');
      }
    };


    fetchAnalytics();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Principal Dashboard" />

        <main className="page">
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

          {!analytics ? (
            <p>Loading analytics...</p>
          ) : (
            <>
              <div className="grid">
                <section className="card">
                  <h3 style={{ marginTop: 0 }}>SPI Ranking (Top 10)</h3>
                  <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                    {analytics.spiRanking.slice(0, 10).map((item) => (
                      <li key={item.uid}>
                        {item.name} ({item.class}) - {item.spi} ({item.category})
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="card">
                  <h3 style={{ marginTop: 0 }}>Academic Leaders</h3>
                  <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                    {analytics.academicLeaders.map((item) => (
                      <li key={item.uid}>
                        {item.name} - Avg {item.averageMarks}
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="card">
                  <h3 style={{ marginTop: 0 }}>Sports Leaders</h3>
                  <ol style={{ margin: 0, paddingLeft: '1rem' }}>
                    {analytics.sportsLeaders.map((item) => (
                      <li key={item.uid}>
                        {item.name} - {item.sportsPoints} points
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              <section className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Participation Statistics</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Students</th>
                        <th>Participation Entries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.participationStatistics.map((item) => (
                        <tr key={item.class}>
                          <td>{item.class}</td>
                          <td>{item.studentCount}</td>
                          <td>{item.participationEntries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Students Needing Support</h3>
                {analytics.studentsNeedingSupport.length ? (
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    {analytics.studentsNeedingSupport.map((item) => (
                      <li key={item.uid}>
                        {item.name} ({item.class}) - SPI {item.spi}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No students currently under support threshold.</p>
                )}
              </section>
                <section style={{ marginTop: '1rem' }}>
                  <OpportunityCreateForm heading="Post Opportunity (Principal)" />
                </section>

                <OpportunityApplicationsReview />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
