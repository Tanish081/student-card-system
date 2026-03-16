import { useState } from 'react';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 00-5 5v2.7c0 .8-.3 1.6-.8 2.2L4 15v1h16v-1l-2.2-2.1a3.2 3.2 0 01-.8-2.2V8a5 5 0 00-5-5zm0 18a2.5 2.5 0 002.4-2h-4.8A2.5 2.5 0 0012 21z" fill="currentColor"/></svg>
);

const PrincipalTopNav = ({ user, schoolName, activeTab, onTabChange, onToggleNotifications, notificationCount, onLogout }) => {
  const [open, setOpen] = useState(false);
  const tabs = ['Overview', 'Students', 'Achievements', 'Opportunities', 'Reports'];
  const initials = user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'PR';

  return (
    <header className="principal-topnav">
      <div className="principal-top-brand">
        <span className="principal-mark" aria-hidden="true" />
        <strong>StudentID</strong>
      </div>

      <nav className="principal-tab-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="principal-top-actions">
        <span className="principal-school-pill">{schoolName}</span>
        <button type="button" className="principal-bell" onClick={onToggleNotifications}>
          <BellIcon />
          {notificationCount ? <i>{notificationCount}</i> : null}
        </button>
        <div className="principal-avatar-wrap">
          <button type="button" className="principal-avatar" onClick={() => setOpen((prev) => !prev)}>{initials}</button>
          {open ? (
            <div className="principal-menu">
              <p>{user?.name || 'Principal'}</p>
              <span>principal</span>
              <button type="button" onClick={onLogout}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default PrincipalTopNav;
