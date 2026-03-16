import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLES = ['student', 'teacher', 'principal', 'admin'];

const TAGLINES = {
  student: 'Your achievements. Verified. Permanent.',
  teacher: 'Guide growth. Verify truth. Shape futures.',
  principal: 'Institutional trust with verifiable records.',
  admin: 'Secure governance for every student identity.'
};

const STATUS_PILLS = ['Verified Records', 'SPI Score', 'Scheme Eligible'];

const INPUT_ICONS = {
  email: '🪪',
  password: '🔒'
};

const LOGO_SVG = (
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <rect x="8" y="8" width="104" height="104" rx="12" className="login-logo-stroke" />
    <rect x="20" y="20" width="16" height="16" className="login-logo-fill" />
    <rect x="84" y="20" width="16" height="16" className="login-logo-fill" />
    <rect x="20" y="84" width="16" height="16" className="login-logo-fill" />
    <rect x="84" y="84" width="16" height="16" className="login-logo-fill" />
    <rect x="50" y="20" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="62" y="20" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="20" y="50" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="20" y="62" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="92" y="50" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="92" y="62" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="50" y="92" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="62" y="92" width="8" height="8" className="login-logo-fill-muted" />
    <rect x="50" y="50" width="20" height="20" className="login-logo-fill" />
  </svg>
);

const Spinner = () => <span className="login-spinner" aria-hidden="true" />;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, logout } = useAuth();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const resetPulseRef = useRef(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hoverNetwork, setHoverNetwork] = useState(false);
  const [logoPulse, setLogoPulse] = useState(false);
  const [submitState, setSubmitState] = useState('idle');
  const [shakeCard, setShakeCard] = useState(false);

  const roleIndex = useMemo(() => ROLES.indexOf(selectedRole), [selectedRole]);

  useEffect(
    () => () => {
      if (resetPulseRef.current) clearTimeout(resetPulseRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const particleCount = 60;
    const nodes = [];

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < particleCount; i += 1) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: 3 + Math.random() * 2,
        c: Math.random() > 0.5
          ? 'rgba(255,107,53,0.6)'
          : 'rgba(244,166,35,0.42)'
      });
    }

    const draw = () => {
      const distLimit = hoverNetwork ? 160 : 120;
      const glowMul = hoverNetwork ? 1.15 : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < node.r || node.x > canvas.width - node.r) node.vx *= -1;
        if (node.y < node.r || node.y > canvas.height - node.r) node.vy *= -1;

        for (let j = i + 1; j < nodes.length; j += 1) {
          const next = nodes[j];
          const dx = node.x - next.x;
          const dy = node.y - next.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= distLimit) {
            const opacity = ((distLimit - dist) / distLimit) * 0.32 * glowMul;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `rgba(255,107,53,${opacity.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.c;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [hoverNetwork]);

  const triggerLogoPulse = () => {
    setLogoPulse(true);
    if (resetPulseRef.current) clearTimeout(resetPulseRef.current);
    resetPulseRef.current = setTimeout(() => setLogoPulse(false), 320);
  };

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (event.target.name === 'email') triggerLogoPulse();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitState('loading');
    try {
      const user = await login(formData.email, formData.password);

      if (selectedRole && user.role !== selectedRole) {
        logout();
        setError(`Role mismatch: you selected "${selectedRole}" but this account is "${user.role}".`);
        setSubmitState('idle');
        setShakeCard(true);
        setTimeout(() => setShakeCard(false), 360);
        return;
      }

      setSubmitState('success');
      setTimeout(() => navigate(`/${user.role}`), 350);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
      setSubmitState('idle');
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 360);
    }
  };

  return (
    <div className="login-civic-root">
      <section
        className="login-civic-left"
        onMouseEnter={() => setHoverNetwork(true)}
        onMouseLeave={() => setHoverNetwork(false)}
      >
        <canvas ref={canvasRef} className="login-network-canvas" />
        <div className="login-hex-overlay" aria-hidden="true" />

        <div className="login-brand-layer">
          <div className={`login-qr-mark ${logoPulse ? 'is-pulse' : ''}`}>{LOGO_SVG}</div>
          <h1 className="login-brand-name">StudentID</h1>
          <p className="login-brand-tagline">{TAGLINES[selectedRole]}</p>

          <div className="login-pill-row">
            {STATUS_PILLS.map((item) => (
              <span key={item} className="login-status-pill">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="login-civic-right">
        <div className={`login-civic-card ${shakeCard ? 'is-shake' : ''}`}>
          <h2 className="login-form-title">Civic Student Identity</h2>
          <p className="login-form-subtitle">Trusted access to verified educational records</p>

          <div className="login-role-tabs" role="tablist" aria-label="Select role">
            <div className="login-role-indicator" style={{ transform: `translateX(${roleIndex * 100}%)` }} />
            {ROLES.map((role) => (
              <button
                type="button"
                key={role}
                className={`login-role-tab ${selectedRole === role ? 'is-active' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-civic-form">
            <label htmlFor="login-uid-email" className="login-field-wrap">
              <span className="login-field-label">UID / Email</span>
              <div className={`login-input-shell ${focusedField === 'email' ? 'is-focused' : ''}`}>
                <span className="login-input-icon" aria-hidden="true">{INPUT_ICONS.email}</span>
                <input
                  id="login-uid-email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter UID or email"
                  required
                />
              </div>
            </label>

            <label htmlFor="login-password" className="login-field-wrap">
              <span className="login-field-label">Password</span>
              <div className={`login-input-shell ${focusedField === 'password' ? 'is-focused' : ''}`}>
                <span className="login-input-icon" aria-hidden="true">{INPUT_ICONS.password}</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </label>

            {error ? <p className="login-error-text">{error}</p> : null}

            <button type="submit" className="login-submit-btn" disabled={loading || submitState === 'success'}>
              <span className="login-btn-shimmer" aria-hidden="true" />
              {submitState === 'loading' ? (
                <span className="login-submit-state"><Spinner /> Validating...</span>
              ) : null}
              {submitState === 'success' ? <span className="login-submit-state">✓ Verified</span> : null}
              {submitState === 'idle' ? <span className="login-submit-state">Login Securely</span> : null}
            </button>

            <button type="button" className="login-forgot-link">
              Forgot password?
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
