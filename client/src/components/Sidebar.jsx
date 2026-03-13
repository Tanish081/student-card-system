import { Link } from 'react-router-dom';

const menusByRole = {
  admin: [
    { label: 'Dashboard', to: '/admin' }
  ],
  student: [
    { label: 'Dashboard', to: '/student' },
    { label: 'My Profile', to: '/students/me' }
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher' },
    { label: 'Add Achievement', to: '/achievements/add' },
    { label: 'Verify Achievement', to: '/achievements/verify' }
  ],
  principal: [
    { label: 'Dashboard', to: '/principal' }
  ]
};

const Sidebar = ({ role }) => {
  const menus = menusByRole[role] || [];

  return (
    <aside className="sidebar">
      <h2>School Performance</h2>
      <nav>
        {menus.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
