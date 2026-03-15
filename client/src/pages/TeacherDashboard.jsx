import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ClassList from '../components/ClassList';
import OpportunityCreateForm from '../components/OpportunityCreateForm';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classRanking, setClassRanking] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [guidanceForm, setGuidanceForm] = useState({ studentUID: '', message: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const classTeacherAssignments = useMemo(
    () => assignments.filter((entry) => entry.role === 'ClassTeacher'),
    [assignments]
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assignmentsRes, studentsRes] = await Promise.all([
          api.get('/teachers/me/assignments'),
          api.get('/teachers/me/students')
        ]);

        setAssignments(assignmentsRes.data.data.assignments || []);
        setStudents(studentsRes.data.data.students || []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load teacher dashboard');
      }
    };

    fetchDashboardData();
  }, []);

  const monitorClassSPI = async () => {
    if (!selectedClass) return;

    try {
      const response = await api.get(`/spi/class/${selectedClass}`);
      setClassRanking(response.data.data.ranking || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load class SPI ranking');
    }
  };

  const handleGuidanceSubmit = async (event) => {
    event.preventDefault();
    setNotice('');

    try {
      await api.post('/teachers/guidance', guidanceForm);
      setGuidanceForm({ studentUID: '', message: '' });
      setNotice('Guidance added successfully.');
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to add guidance');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Teacher Dashboard" />

        <main className="page">
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          {notice ? <p style={{ color: '#166534' }}>{notice}</p> : null}

          <div className="grid">
            <ClassList classes={assignments} />

            <section className="card">
              <h3 style={{ marginTop: 0 }}>Class Teacher Controls</h3>
              <p>Verify achievements, monitor SPI, and add guidance for assigned classes.</p>
              <p>
                <Link to="/achievements/verify">Go to Verify Achievement</Link>
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem' }}>
                <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                  <option value="">Select class for SPI monitoring</option>
                  {classTeacherAssignments.map((entry, index) => (
                    <option value={entry.class} key={`${entry.class}-${index}`}>
                      {entry.class}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={monitorClassSPI}>
                  Monitor SPI
                </button>
              </div>

              {classRanking.length ? (
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {classRanking.map((item) => (
                    <li key={item.uid}>
                      {item.name} ({item.uid}) - SPI {item.spi} ({item.category})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b' }}>Select a class to load SPI ranking.</p>
              )}
            </section>
          </div>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Add Guidance</h3>
            <form onSubmit={handleGuidanceSubmit}>
              <div className="form-grid">
                <div>
                  <label htmlFor="studentUID">Student UID</label>
                  <input
                    id="studentUID"
                    value={guidanceForm.studentUID}
                    onChange={(event) =>
                      setGuidanceForm((prev) => ({ ...prev, studentUID: event.target.value.toUpperCase() }))
                    }
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="message">Guidance</label>
                  <textarea
                    id="message"
                    rows={3}
                    value={guidanceForm.message}
                    onChange={(event) =>
                      setGuidanceForm((prev) => ({ ...prev, message: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <button type="submit">Add Guidance</button>
            </form>
          </section>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Assigned Students</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>UID</th>
                    <th>Class</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length ? (
                    students.map((student) => (
                      <tr key={student.uid}>
                        <td>{student.name}</td>
                        <td>{student.uid}</td>
                        <td>
                          {student.class}
                          {student.section}
                        </td>
                        <td>
                          <Link to={`/students/${student.uid}`}>Profile</Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>No assigned students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: '1rem' }}>
            <OpportunityCreateForm heading="Post Opportunity (Teacher)" allowScholarship={false} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
