import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const AddAchievement = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentUID: '',
    eventName: '',
    category: 'sports',
    level: 'School',
    position: 'Participation',
    certificateURL: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    try {
      const response = await api.post('/achievements', {
        ...formData,
        studentUID: formData.studentUID.toUpperCase()
      });
      setResult(response.data.data);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to add achievement');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Add Achievement" />

        <main className="page">
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Add Achievement Entry</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label htmlFor="studentUID">Student UID</label>
                  <input id="studentUID" name="studentUID" value={formData.studentUID} onChange={handleChange} required />
                </div>

                <div>
                  <label htmlFor="eventName">Event Name</label>
                  <input id="eventName" name="eventName" value={formData.eventName} onChange={handleChange} required />
                </div>

                <div>
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange}>
                    <option value="sports">Sports</option>
                    <option value="activity">Activity</option>
                    <option value="extracurricular">Extracurricular</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="level">Level</label>
                  <select id="level" name="level" value={formData.level} onChange={handleChange}>
                    <option value="School">School</option>
                    <option value="Inter-school">Inter-school</option>
                    <option value="District">District</option>
                    <option value="State">State</option>
                    <option value="National">National</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="position">Position</label>
                  <select id="position" name="position" value={formData.position} onChange={handleChange}>
                    <option value="Participation">Participation</option>
                    <option value="3rd Prize">3rd Prize</option>
                    <option value="2nd Prize">2nd Prize</option>
                    <option value="1st Prize">1st Prize</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="certificateURL">Certificate URL (optional)</label>
                  <input
                    id="certificateURL"
                    name="certificateURL"
                    value={formData.certificateURL}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '0.9rem' }}>
                Save Achievement
              </button>
            </form>

            {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
            {result ? (
              <p style={{ color: '#166534' }}>
                Added successfully. Calculated points: <strong>{result.points}</strong>
              </p>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
};

export default AddAchievement;
