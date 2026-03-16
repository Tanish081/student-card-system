import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StudentCard from '../components/StudentCard';
import AchievementTable from '../components/AchievementTable';
import SPIGraph from '../components/SPIGraph';
import OpportunityFeed from '../components/OpportunityFeed';
import EligibilityPanel from '../components/EligibilityPanel';
import StudentIDCard from '../components/StudentIDCard';
import NotificationsPanel from '../components/NotificationsPanel';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.linkedStudentUID) {
        setError('Student account is not linked to a student UID.');
        return;
      }

      try {
        const response = await api.get(`/students/${user.linkedStudentUID}/dashboard`);
        setDashboard(response.data.data);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load dashboard');
      }
    };

    fetchDashboard();
  }, [user]);

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Student Dashboard" />

        <main className="page">
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

          {dashboard ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <Link to={`/students/${dashboard.uid}`}>Open full profile</Link>
              </div>

              <div className="grid">
                <StudentCard profile={dashboard.profile} spi={dashboard.spi} />
                <SPIGraph spi={dashboard.spi} />
              </div>

              <StudentIDCard profile={dashboard.profile} spi={dashboard.spi} />

              <EligibilityPanel uid={dashboard.uid} />

              <div style={{ marginTop: '1rem' }}>
                <AchievementTable achievements={dashboard.achievements} />
              </div>

              <section className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Teacher Feedback</h3>
                {dashboard.teacherFeedback?.length ? (
                  <ul style={{ paddingLeft: '1rem' }}>
                    {dashboard.teacherFeedback.map((feedback) => (
                      <li key={feedback._id}>{feedback.message}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No feedback entries yet.</p>
                )}
              </section>

              <section className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Participation History</h3>
                {dashboard.participationHistory?.length ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th>Category</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.participationHistory.map((item, index) => (
                          <tr key={`${item.activityName}-${index}`}>
                            <td>{item.activityName}</td>
                            <td>{item.category}</td>
                            <td>{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No participation entries yet.</p>
                )}
              </section>

              <OpportunityFeed />

              <NotificationsPanel />
            </>
          ) : (
            !error && <p>Loading dashboard...</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
