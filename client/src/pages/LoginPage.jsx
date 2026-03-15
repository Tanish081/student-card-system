import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LABEL = {
  display: 'block',
  fontSize: '0.73rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  marginBottom: '7px',
};

const FIELD_BASE = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '0.93rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, logout } = useAuth();
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({ x: dy * 5, y: -dx * 5 });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

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
    ...FIELD_BASE,
    border: focusedField === name
      ? '1px solid rgba(167,139,250,0.7)'
      : '1px solid rgba(255,255,255,0.09)',
    background: focusedField === name
      ? 'rgba(139,92,246,0.12)'
      : 'rgba(255,255,255,0.05)',
    boxShadow: focusedField === name
      ? '0 0 0 3px rgba(139,92,246,0.18)'
      : 'none',
  });

  return (
    <div
      className="login-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Poppins', system-ui, sans-serif",
      }}
    >
      {/* Aurora blobs */}
      <div aria-hidden="true" className="aurora-blob aurora-1" />
      <div aria-hidden="true" className="aurora-blob aurora-2" />
      <div aria-hidden="true" className="aurora-blob aurora-3" />

      {/* Split container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          maxWidth: '900px',
          minHeight: '560px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.65)',
          margin: '1rem',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Left: Image panel */}
        <div className="login-image-panel" style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <img
            src="/login.png"
            alt="School campus"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(7,9,22,0.88) 0%, rgba(7,9,22,0.15) 55%, transparent 100%)',
          }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', color: '#fff' }}>
            <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
              Empowering every learner
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.42)' }}>
              School Student Performance System
            </p>
          </div>
        </div>

        {/* Right: Form panel */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '380px',
            flexShrink: 0,
            background: 'rgba(10,12,30,0.94)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            padding: '2.8rem 2.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff',
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              fontSize: '1.4rem',
              marginBottom: '1.1rem',
              boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            }}>🎓</div>
            <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              Sign in to your Student SPI account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={LABEL}>Role</label>
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('role'), cursor: 'pointer' }}
              >
                <option value="admin" style={{ background: '#0a0c1e' }}>Admin</option>
                <option value="principal" style={{ background: '#0a0c1e' }}>Principal</option>
                <option value="teacher" style={{ background: '#0a0c1e' }}>Teacher</option>
                <option value="student" style={{ background: '#0a0c1e' }}>Student</option>
              </select>
            </div>

            <div>
              <label style={LABEL}>Email</label>
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

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.28)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                borderRadius: '12px',
                background: loading
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#fff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: loading ? 'none' : '0 4px 22px rgba(124,58,237,0.5)',
                transition: 'all 0.2s ease',
                marginTop: '0.3rem',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{
            marginTop: '1.8rem',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.22)',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}>
            School Student Performance System • v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
