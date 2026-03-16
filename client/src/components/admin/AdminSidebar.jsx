const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zm9 0h7v4h-7zm0 6h7v10h-7zM4 13h7v7H4z" fill="currentColor" /></svg>
  ),
  students: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5zm13-8a3 3 0 100-6 3 3 0 000 6z" fill="currentColor" /></svg>
  ),
  schools: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V5l8-3 8 3v15h-6v-5h-4v5H4zm4-9h2V9H8zm0 4h2v-2H8zm6-4h2V9h-2zm0 4h2v-2h-2z" fill="currentColor" /></svg>
  ),
  achievements: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.2 5.7.8-4.1 4 1 5.7L12 16l-5.2 2.7 1-5.7-4.1-4 5.7-.8L12 3z" fill="currentColor" /></svg>
  ),
  opportunities: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4V2h6v2h5v16H4V4h5zm0 2H6v12h12V6h-3v2H9V6zm2 0h2V4h-2v2z" fill="currentColor" /></svg>
  ),
  schemes: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L4 6v6c0 5.2 3.3 9.9 8 11 4.7-1.1 8-5.8 8-11V6l-8-4z" fill="currentColor" /></svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v2H5zm0 5h14v2H5zm0 5h14v2H5zm0 5h9v2H5z" fill="currentColor" /></svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13a7.7 7.7 0 000-2l2-1.6-2-3.4-2.4 1a8 8 0 00-1.7-1L15 2h-6l-.3 3a8 8 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 000 2l-2 1.6 2 3.4 2.4-1a8 8 0 001.7 1l.3 3h6l.3-3a8 8 0 001.7-1l2.4 1 2-3.4-2-1.6zM12 15a3 3 0 110-6 3 3 0 010 6z" fill="currentColor" /></svg>
  )
};

const LogoMark = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect x="4" y="4" width="40" height="40" rx="6" className="admin-logo-stroke" />
    <rect x="11" y="11" width="8" height="8" className="admin-logo-fill" />
    <rect x="29" y="11" width="8" height="8" className="admin-logo-fill" />
    <rect x="11" y="29" width="8" height="8" className="admin-logo-fill" />
    <rect x="29" y="29" width="8" height="8" className="admin-logo-fill" />
    <rect x="20" y="20" width="8" height="8" className="admin-logo-fill" />
  </svg>
);

const AdminSidebar = ({ items, activeItem, onSelect, badges = {}, compact = false }) => {
  return (
    <aside className={`admin-sidebar ${compact ? 'is-compact' : ''}`}>
      <div>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo"><LogoMark /></div>
          {!compact ? (
            <div>
              <p className="admin-sidebar-title">StudentID</p>
              <p className="admin-sidebar-live"><span /> LIVE SYSTEM</p>
            </div>
          ) : null}
        </div>

        <nav className="admin-sidebar-nav">
          {items.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`admin-nav-item ${activeItem === item.key ? 'is-active' : ''}`}
              onClick={() => onSelect(item.key)}
              title={compact ? item.label : undefined}
            >
              <span className="admin-nav-icon">{ICONS[item.icon] || ICONS.overview}</span>
              {!compact ? <span className="admin-nav-label">{item.label}</span> : null}
              {!compact && badges[item.key] ? <span className="admin-nav-badge">{badges[item.key]}</span> : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        {!compact ? <p>3 admin sessions active</p> : null}
        <div className="admin-health">
          <span><i className="is-ok" />API</span>
          <span><i className="is-ok" />DB</span>
          <span><i className="is-ok" />Storage</span>
        </div>
        {!compact ? <p>v2.4.1</p> : null}
      </div>
    </aside>
  );
};

export default AdminSidebar;
