import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import OpportunityCreateForm from '../components/OpportunityCreateForm';
import OpportunityApplicationsReview from '../components/OpportunityApplicationsReview';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const initialTeacherForm = {
  teacherID: '',
  name: '',
  email: '',
  password: ''
};

const initialStudentForm = {
  firstName: '',
  lastName: '',
  dob: '',
  class: '',
  section: '',
  admissionYear: '',
  email: '',
  password: ''
};

const initialRoleForm = {
  teacherID: '',
  role: 'ClassTeacher',
  class: '',
  subject: ''
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/students')
      ]);

      setTeachers(teachersRes.data.data.teachers || []);
      setStudents(studentsRes.data.data.students || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTeacherCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/admin/create-teacher', teacherForm);
      setTeacherForm(initialTeacherForm);
      setMessage('Teacher account created successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleStudentCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/admin/create-student', {
        ...studentForm,
        section: studentForm.section.toUpperCase()
      });
      setStudentForm(initialStudentForm);
      setMessage('Student account created successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to create student');
    }
  };

  const handleRoleAssign = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.put('/admin/assign-teacher-role', {
        ...roleForm,
        class: roleForm.class.toUpperCase(),
        subject: roleForm.subject || undefined
      });
      setRoleForm(initialRoleForm);
      setMessage('Teacher role assigned successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to assign teacher role');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Admin Dashboard" />

        <main className="page">
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          {message ? <p style={{ color: '#166534' }}>{message}</p> : null}

          <div className="grid">
            <section className="card">
              <h3 style={{ marginTop: 0 }}>Create Teacher Account</h3>
              <form onSubmit={handleTeacherCreate}>
                <div className="form-grid">
                  <input
                    placeholder="Teacher ID"
                    value={teacherForm.teacherID}
                    onChange={(event) => setTeacherForm((prev) => ({ ...prev, teacherID: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Name"
                    value={teacherForm.name}
                    onChange={(event) => setTeacherForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={teacherForm.email}
                    onChange={(event) => setTeacherForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Password"
                    type="password"
                    value={teacherForm.password}
                    onChange={(event) => setTeacherForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                </div>
                <button type="submit" style={{ marginTop: '0.75rem' }}>
                  Create Teacher
                </button>
              </form>
            </section>

            <section className="card">
              <h3 style={{ marginTop: 0 }}>Assign Teacher Role</h3>
              <form onSubmit={handleRoleAssign}>
                <div className="form-grid">
                  <input
                    placeholder="Teacher ID"
                    value={roleForm.teacherID}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, teacherID: event.target.value }))}
                    required
                  />
                  <select
                    value={roleForm.role}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, role: event.target.value }))}
                  >
                    <option value="ClassTeacher">Class Teacher</option>
                    <option value="SubjectTeacher">Subject Teacher</option>
                    <option value="SportsTeacher">Sports Teacher</option>
                  </select>
                  <input
                    placeholder="Class Assignment (e.g. 8A)"
                    value={roleForm.class}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, class: event.target.value }))}
                  />
                  <input
                    placeholder="Subject (for Subject Teacher)"
                    value={roleForm.subject}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, subject: event.target.value }))}
                  />
                </div>
                <button type="submit" style={{ marginTop: '0.75rem' }}>
                  Assign Role
                </button>
              </form>
            </section>
          </div>

          <section className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Create Student Account</h3>
            <form onSubmit={handleStudentCreate}>
              <div className="form-grid">
                <input
                  placeholder="First Name"
                  value={studentForm.firstName}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                />
                <input
                  placeholder="Last Name"
                  value={studentForm.lastName}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                />
                <input
                  type="date"
                  value={studentForm.dob}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, dob: event.target.value }))}
                  required
                />
                <input
                  placeholder="Class"
                  value={studentForm.class}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, class: event.target.value }))}
                  required
                />
                <input
                  placeholder="Section"
                  value={studentForm.section}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, section: event.target.value }))}
                  required
                />
                <input
                  placeholder="Admission Year"
                  value={studentForm.admissionYear}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, admissionYear: event.target.value }))}
                  required
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={studentForm.email}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={studentForm.password}
                  onChange={(event) => setStudentForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>
              <button type="submit" style={{ marginTop: '0.75rem' }}>
                Create Student
              </button>
            </form>
          </section>

          <div className="grid" style={{ marginTop: '1rem' }}>
            <section className="card">
              <h3 style={{ marginTop: 0 }}>Teachers</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Teacher ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assignments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.teacherID}>
                        <td>{teacher.teacherID}</td>
                        <td>{teacher.name}</td>
                        <td>{teacher.email}</td>
                        <td>
                          {teacher.assignments?.length
                            ? teacher.assignments.map((item) => `${item.role}${item.class ? ` - ${item.class}` : ''}${item.subject ? ` (${item.subject})` : ''}`).join(', ')
                            : 'No assignments'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h3 style={{ marginTop: 0 }}>Students</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>UID</th>
                      <th>Class</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.uid}>
                        <td>{student.name}</td>
                        <td>{student.uid}</td>
                        <td>{student.class}{student.section}</td>
                        <td>
                          <Link to={`/students/${student.uid}`}>Open Profile</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section style={{ marginTop: '1rem' }}>
            <OpportunityCreateForm heading="Post Opportunity (Admin)" />
          </section>

          <OpportunityApplicationsReview />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
