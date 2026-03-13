import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AchievementTable from '../components/AchievementTable';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const VerifyAchievement = () => {
  const { user } = useAuth();
  const [studentUID, setStudentUID] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');

  const loadAchievements = async () => {
    if (!studentUID) return;
    setError('');

    try {
      const response = await api.get(`/achievements/student/${studentUID.toUpperCase()}`);
      setAchievements(response.data.data.achievements || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load achievements');
    }
  };

  const updateStatus = async (achievementId, status) => {
    setError('');

    try {
      await api.patch(`/achievements/${achievementId}/verify`, { status });
      await loadAchievements();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to update achievement status');
    }
  };

  const pending = achievements.filter((item) => item.status === 'Pending');

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Verify Achievement" />

        <main className="page">
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Search by Student UID</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                placeholder="Enter UID"
                value={studentUID}
                onChange={(event) => setStudentUID(event.target.value)}
              />
              <button type="button" onClick={loadAchievements}>
                Load
              </button>
            </div>
            {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          </section>

          <div style={{ marginTop: '1rem' }}>
            <AchievementTable achievements={achievements} />
          </div>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Pending Verifications</h3>
            {pending.length ? (
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {pending.map((item) => (
                  <li key={item._id} style={{ marginBottom: '0.5rem' }}>
                    {item.eventName} ({item.level})
                    <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem' }}>
                      <button type="button" onClick={() => updateStatus(item._id, 'Approved')}>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => updateStatus(item._id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No pending achievements for this student.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default VerifyAchievement;
