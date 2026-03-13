import { useAuth } from '../hooks/useAuth';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <strong>{title}</strong>
      <div>
        <span style={{ marginRight: '1rem' }}>{user?.name}</span>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
