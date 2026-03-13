import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, logout } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('admin');
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

    try {
      const user = await login(formData.email, formData.password);

      if (selectedRole && user.role !== selectedRole) {
        logout();
        setError(`Selected role does not match this account. Expected ${selectedRole}, got ${user.role}.`);
        return;
      }

      navigate(`/${user.role}`);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem'
      }}
    >
      <section className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginTop: 0 }}>School Performance Login</h2>
        <p style={{ color: '#475569' }}>Use admin / principal / teacher / student credentials to continue.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.8rem' }}>
            <label htmlFor="role">User Type</label>
            <select
              id="role"
              name="role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              required
            >
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div style={{ marginBottom: '0.8rem' }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '0.8rem' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
