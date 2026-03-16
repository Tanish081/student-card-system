import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <main className="unauthorized-page">
      <section className="unauthorized-card">
        <h1>Unauthorized</h1>
        <p>Your account does not have permission to view this page.</p>
        <button type="button" onClick={() => navigate('/login', { replace: true })}>
          Go back to login
        </button>
      </section>
    </main>
  );
};

export default UnauthorizedPage;
