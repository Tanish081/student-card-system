import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LABEL = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.75)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const FIELD = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  backdropFilter: 'blur(4px)',
  transition: 'border-color 0.2s, background 0.2s',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, logout } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [focusedField, setFocusedField] = useState(null);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(formData.email, formData.password);
      if (selectedRole && user.role !== selectedRole) {
        logout();
        setError(`Role mismatch: you selected "${selectedRole}" but this account is "${user.role}".`);
        return;
      }
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const fieldStyle = (name) => ({
    ...FIELD,
    borderColor: focusedField === name ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)',
    background: focusedField === name ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
  });

  return (
    <div
      className="login-bg"
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '1rem',
        fontFamily: "'Inter', 'Poppins', system-ui, sans-serif",
      }}
    >
      {/* Mouse-follow glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 65%)',
          left: `${glow.x}%`,
          top: `${glow.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'left 0.1s ease-out, top 0.1s ease-out',
        }}
      />

      {/* Login card */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '430px',
          padding: '2.5rem 2.2rem',
          borderRadius: '22px',
          background: 'rgba(255,255,255,0.13)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
          color: '#fff',
        }}
      >
        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #2563eb)',
            margin: '0 auto 1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: '0 4px 18px rgba(99,102,241,0.45)',
          }}>
            🎓
          </div>
          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Student SPI Platform
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            Discover opportunities. Track achievements.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Role */}
          <div>
            <label style={LABEL}>User Type</label>
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              onFocus={() => setFocusedField('role')}
              onBlur={() => setFocusedField(null)}
              style={{ ...fieldStyle('role'), cursor: 'pointer' }}
            >
              <option value="admin" style={{ background: '#1e3a8a' }}>Admin</option>
              <option value="principal" style={{ background: '#1e3a8a' }}>Principal</option>
              <option value="teacher" style={{ background: '#1e3a8a' }}>Teacher</option>
              <option value="student" style={{ background: '#1e3a8a' }}>Student</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label style={LABEL}>Email Address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder="you@school.edu"
              style={fieldStyle('email')}
            />
          </div>

          {/* Password */}
          <div>
            <label style={LABEL}>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder="••••••••"
              style={fieldStyle('password')}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.38)',
              color: '#fca5a5',
              fontSize: '0.87rem',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px',
              borderRadius: '12px',
              background: loading
                ? 'rgba(99,102,241,0.4)'
                : 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : '0 4px 18px rgba(79,70,229,0.5)',
              transition: 'all 0.2s ease',
              marginTop: '0.2rem',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p style={{
          marginTop: '1.6rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.38)',
          letterSpacing: '0.02em',
        }}>
          School Student Performance System • v1.0
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
