import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AnimatedBackground from "../components/AnimatedBackground";

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
  <div
    className="login-bg"
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "1rem"
    }}
  >

    {/* Animated Background */}
    <AnimatedBackground />

    {/* Glass Login Card */}
    <section
      style={{
        width: "100%",
        maxWidth: 420,
        padding: "2rem",
        borderRadius: "16px",
        backdropFilter: "blur(14px)",
        background: "rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        color: "white",
        position: "relative",
        zIndex: 1
      }}
    >
      <h2 style={{ marginTop: 0, textAlign: "center" }}>
        Student SPI Platform
      </h2>

      <p style={{ textAlign: "center", opacity: 0.9 }}>
        Discover opportunities. Track achievements.
      </p>

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: "0.8rem" }}>
          <label>User Type</label>

          <select
            name="role"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "4px"
            }}
          >
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <label>Email</label>

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "4px"
            }}
          />
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <label>Password</label>

          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "4px"
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#fecaca", marginBottom: "8px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            border: "none",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

      </form>
    </section>

  </div>
);
};

export default LoginPage;
