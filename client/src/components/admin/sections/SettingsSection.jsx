const SettingsSection = () => {
  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Settings</h2>
      </header>

      <div className="settings-grid">
        <article className="card-muted">
          <h3>System Info</h3>
          <p>JWT-secured API requests are active for all protected endpoints.</p>
        </article>
        <article className="card-muted">
          <h3>Access Policy</h3>
          <p>Only admin accounts can access this dashboard route.</p>
        </article>
      </div>
    </section>
  );
};

export default SettingsSection;
