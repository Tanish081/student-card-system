import { useEffect, useRef, useState } from 'react';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 00-5 5v2.7c0 .8-.3 1.6-.8 2.2L4 15v1h16v-1l-2.2-2.1a3.2 3.2 0 01-.8-2.2V8a5 5 0 00-5-5zm0 18a2.5 2.5 0 002.4-2h-4.8A2.5 2.5 0 0012 21z" fill="currentColor"/></svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3a8 8 0 105 14.3l4 4 1.4-1.4-4-4A8 8 0 0011 3zm0 2a6 6 0 110 12 6 6 0 010-12z" fill="currentColor"/></svg>
);

const AdminTopBar = ({
  user,
  breadcrumb = 'Overview',
  searchValue,
  onSearchChange,
  onOpenSearch,
  notificationCount,
  onToggleNotifications,
  onLogout
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const initials = user?.name
    ? user.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
    : 'AD';

  return (
    <header className="admin-topbar">
      <p>{breadcrumb}</p>

      <div className="admin-topbar-actions">
        <label className="admin-topbar-search">
          <SearchIcon />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={onOpenSearch}
            placeholder="Search students, schools, UIDs..."
          />
        </label>

        <button type="button" className="admin-topbar-bell" onClick={onToggleNotifications}>
          <BellIcon />
          {notificationCount ? <span>{notificationCount}</span> : null}
        </button>

        <div className="admin-topbar-avatar-wrap" ref={menuRef}>
          <button type="button" className="admin-topbar-avatar" onClick={() => setOpen((prev) => !prev)}>
            {initials}
          </button>
          {open ? (
            <div className="admin-topbar-menu">
              <p>{user?.name || 'Admin User'}</p>
              <span>{user?.role || 'admin'}</span>
              <button type="button">View Profile</button>
              <button type="button" onClick={onLogout}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
