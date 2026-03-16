import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AdminLoginCanvas from '../components/AdminLoginCanvas';
import { useAuth } from '../hooks/useAuth';
import useCountUp from '../hooks/useCountUp';
import '../styles/adminLogin.css';

const ROLES = ['admin', 'principal'];

const ROLE_COPY = {
  admin: {
    subtitle: 'Authorized personnel only',
    placeholder: 'Admin UID or Email',
    helper: 'Administrative command lane'
  },
  principal: {
    subtitle: 'Institutional authority only',
    placeholder: 'Principal UID or Email',
    helper: 'School command lane'
  }
};

const STATS = [
  { value: 12847, label: 'Students enrolled', accent: 'teal', delta: '+124 this month' },
  { value: 3291, label: 'Achievements verified', accent: 'teal', delta: '+88 in 7 days' },
  { value: 847, label: 'Scheme eligible', accent: 'teal', delta: '+36 this week' },
  { value: 48, label: 'Schools active', accent: 'teal', delta: '+2 onboarded' },
  { value: 94, label: 'Verify rate', accent: 'teal', suffix: '%', delta: 'Across all institutions' },
  { value: 231, label: 'Pending reviews', accent: 'amber', delta: 'Action required today' }
];

const ACTIVITY = [
  { text: 'Achievement verified - Rahul S., DPS Pune', time: '2m ago' },
  { text: 'New opportunity posted - Science Olympiad 2025', time: '5m ago' },
  { text: 'Student verified via QR - Priya M., Ryan Intl', time: '8m ago' },
  { text: 'Scheme eligibility updated - 14 students', time: '12m ago' },
  { text: 'Audit log entry - Principal Nair', time: '18m ago' },
  { text: 'Bulk status update - 6 applications reviewed', time: '24m ago' },
  { text: 'New student registered - Arjun K., Kendriya V.', time: '31m ago' }
];

const ShieldIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 2L4 6v6c0 5.2 3.3 9.9 8 11 4.7-1.1 8-5.8 8-11V6l-8-4z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 12.5l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BuildingIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 8h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm6-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z" fill="currentColor" />
  </svg>
);

const LockIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 10V7a4 4 0 118 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const EyeIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.3" fill="currentColor" />
  </svg>
);

const EyeOffIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M2 12s3.5-6 10-6c2.3 0 4.2.6 5.8 1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M22 12s-3.5 6-10 6c-2.3 0-4.3-.6-5.9-1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.3" fill="currentColor" />
    <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const Spinner = () => (
  <span className="admin-login-spinner" aria-hidden="true">
    <span />
    <span />
  </span>
);

const StatCard = ({ stat, index, compact = false }) => {
  const value = useCountUp(stat.value, { duration: 1800, delay: 400 + index * 120 });
  const formatted = `${value.toLocaleString('en-IN')}${stat.suffix || ''}`;

  return (
    <article
      className={`admin-login-stat-card ${stat.accent === 'amber' ? 'is-amber' : ''}`}
      style={{ animationDelay: `${300 + index * 80}ms` }}
    >
      <p className="admin-login-stat-value">{formatted}</p>
      <p className="admin-login-stat-label">{stat.label}</p>
      {!compact ? <span className="admin-login-stat-tooltip">{stat.delta}</span> : null}
    </article>
  );
};

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout, loading } = useAuth();

  const initialRole = searchParams.get('role') === 'principal' ? 'principal' : 'admin';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [formData, setFormData] = useState({ email: '', password: '', rememberDevice: true });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [submitState, setSubmitState] = useState('idle');
  const [tickerItems, setTickerItems] = useState(() => ACTIVITY.slice(0, 5));
  const [tickerSliding, setTickerSliding] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);

  const tickerIndexRef = useRef(5);
  const tickerTimerRef = useRef(0);
  const tickerShiftRef = useRef(0);

  const roleIndex = useMemo(() => ROLES.indexOf(selectedRole), [selectedRole]);
  const roleCopy = ROLE_COPY[selectedRole];

  useEffect(() => {
    const schedule = () => {
      const delay = 8000 + Math.floor(Math.random() * 4000);
      tickerTimerRef.current = window.setTimeout(() => {
        setTickerSliding(true);

        tickerShiftRef.current = window.setTimeout(() => {
          setTickerItems((prev) => {
            const nextEntry = ACTIVITY[tickerIndexRef.current % ACTIVITY.length];
            tickerIndexRef.current += 1;
            return [...prev.slice(1), nextEntry];
          });
          setTickerSliding(false);

          if (!tickerPaused) {
            schedule();
          }
        }, 420);
      }, delay);
    };

    if (!tickerPaused) {
      const startTimer = window.setTimeout(schedule, 700);
      return () => {
        window.clearTimeout(startTimer);
        window.clearTimeout(tickerTimerRef.current);
        window.clearTimeout(tickerShiftRef.current);
      };
    }

    return () => {
      window.clearTimeout(tickerTimerRef.current);
      window.clearTimeout(tickerShiftRef.current);
    };
  }, [tickerPaused]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitState('loading');

    try {
      const user = await login(formData.email, formData.password);

      if (!ROLES.includes(user.role)) {
        logout();
        setError('This portal is restricted to admin or principal accounts.');
        setSubmitState('idle');
        setIsShaking(true);
        window.setTimeout(() => setIsShaking(false), 420);
        return;
      }

      if (user.role !== selectedRole) {
        logout();
        setError(`Role mismatch: selected ${selectedRole}, account role is ${user.role}.`);
        setSubmitState('idle');
        setIsShaking(true);
        window.setTimeout(() => setIsShaking(false), 420);
        return;
      }

      setSubmitState('success');
      window.setTimeout(() => navigate(`/${user.role}`), 450);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Authentication failed. Please re-check credentials.');
      setSubmitState('idle');
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 420);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-shell">
        <section className="admin-login-left">
          <AdminLoginCanvas className="admin-login-canvas" />

          <div className="admin-login-left-overlay">
            <header className="admin-login-system-badge admin-login-seq-badge">
              <p className="admin-login-system-title">STUDENT ID PLATFORM</p>
              <p className="admin-login-system-subtitle">Administrative Access</p>
              <p className="admin-login-system-live">
                v2.4
                <span className="admin-login-live-dot" />
                LIVE
              </p>
            </header>

            <section className="admin-login-stats admin-login-seq-stats" aria-label="System statistics">
              {STATS.map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} />
              ))}
            </section>

            <section className={`admin-login-ticker admin-login-seq-ticker ${tickerPaused ? 'is-paused' : ''}`}>
              <p className="admin-login-ticker-title">Recent System Activity</p>
              <div className="admin-login-ticker-viewport">
                <div className={`admin-login-ticker-track ${tickerSliding ? 'is-sliding' : ''}`}>
                  {tickerItems.map((item, index) => (
                    <article className="admin-login-ticker-item" key={`${item.text}-${index}`}>
                      <span className="admin-login-ticker-dot" aria-hidden="true" />
                      <span className="admin-login-ticker-text">{item.text}</span>
                      <span className="admin-login-ticker-time">{item.time}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="admin-login-mobile-strip" aria-hidden="true">
            <div className="admin-login-mobile-strip-head">
              <p>STUDENT ID PLATFORM</p>
              <span>ADMIN ACCESS</span>
            </div>
            <div className="admin-login-mobile-mini-stats">
              {STATS.slice(0, 3).map((stat, index) => (
                <StatCard key={`mobile-${stat.label}`} stat={stat} index={index} compact />
              ))}
            </div>
          </section>
        </section>

        <section className="admin-login-right">
          <div className={`admin-login-card admin-login-seq-card ${isShaking ? 'is-shake' : ''} ${error ? 'has-error' : ''}`}>
            <div className="admin-login-card-head">
              <span className="admin-login-access-pill">ADMIN ACCESS</span>
              <h1>System Login</h1>
              <p>{roleCopy.subtitle}</p>
            </div>

            <div className="admin-login-role-switch" role="tablist" aria-label="Select admin role">
              <div
                className="admin-login-role-indicator"
                style={{ transform: `translateX(${roleIndex * 100}%)` }}
                aria-hidden="true"
              />
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={selectedRole === role}
                  className={`admin-login-role-btn ${selectedRole === role ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setError('');
                  }}
                >
                  {role}
                </button>
              ))}
            </div>

            <p className="admin-login-role-helper">{roleCopy.helper}</p>

            <form className="admin-login-form" onSubmit={handleSubmit}>
              <label className="admin-login-field admin-login-seq-field-1" htmlFor="admin-login-email">
                <span className="admin-login-field-label">UID / Email</span>
                <span className={`admin-login-input-shell ${focusedField === 'email' ? 'is-focused' : ''}`}>
                  <span className="admin-login-input-icon admin-login-input-icon-role" aria-hidden="true">
                    <ShieldIcon className={selectedRole === 'admin' ? 'is-visible' : 'is-hidden'} />
                    <BuildingIcon className={selectedRole === 'principal' ? 'is-visible' : 'is-hidden'} />
                  </span>
                  <input
                    id="admin-login-email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    placeholder={roleCopy.placeholder}
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    onFocus={() => {
                      setFocusedField('email');
                      setTickerPaused(true);
                    }}
                    onBlur={() => {
                      setFocusedField('');
                      setTickerPaused(false);
                    }}
                    required
                  />
                </span>
              </label>

              <label className="admin-login-field admin-login-seq-field-2" htmlFor="admin-login-password">
                <span className="admin-login-field-label">Password</span>
                <span className={`admin-login-input-shell ${focusedField === 'password' ? 'is-focused' : ''}`}>
                  <span className="admin-login-input-icon" aria-hidden="true">
                    <LockIcon />
                  </span>
                  <input
                    id="admin-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter secure passcode"
                    value={formData.password}
                    onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    required
                  />
                  <button
                    type="button"
                    className="admin-login-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>

              <label className="admin-login-remember admin-login-seq-field-3">
                <input
                  type="checkbox"
                  checked={formData.rememberDevice}
                  onChange={(event) => setFormData((prev) => ({ ...prev, rememberDevice: event.target.checked }))}
                />
                <span>Remember this device</span>
              </label>

              <div className={`admin-login-error-wrap ${error ? 'is-visible' : ''}`}>
                {error ? <p className="admin-login-error">{error}</p> : null}
              </div>

              <button
                type="submit"
                className={`admin-login-submit admin-login-seq-field-4 ${submitState === 'success' ? 'is-success' : ''}`}
                disabled={loading || submitState === 'loading' || submitState === 'success'}
              >
                <span className="admin-login-submit-shimmer" aria-hidden="true" />
                {submitState === 'loading' ? (
                  <span className="admin-login-submit-content"><Spinner /> AUTHENTICATING</span>
                ) : null}
                {submitState === 'success' ? <span className="admin-login-submit-content">ACCESS GRANTED</span> : null}
                {submitState === 'idle' ? <span className="admin-login-submit-content">AUTHENTICATE</span> : null}
              </button>
            </form>

            <p className="admin-login-help-row">
              Forgot credentials? <span aria-hidden="true">-</span> Contact system administrator
            </p>

            <div className="admin-login-footnote">
              <span className="admin-login-footnote-line" aria-hidden="true" />
              <p>Secured by StudentID Platform - All access logged</p>
            </div>

            <p className="admin-login-alt-link">
              Student or Teacher access? <Link to="/login">Switch to standard login</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLoginPage;
