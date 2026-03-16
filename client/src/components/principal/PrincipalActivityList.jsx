const PrincipalActivityList = ({ items = [] }) => {
  return (
    <section className="principal-panel">
      <header className="principal-panel-header">
        <h3>Recent Activity</h3>
      </header>

      <div className="principal-activity-list">
        {items.length ? items.map((item) => (
          <article key={item.id}>
            <span />
            <p>{item.text}</p>
            <small>{item.time}</small>
          </article>
        )) : (
          <div className="dashboard-empty-inline">No recent school activity</div>
        )}
      </div>
    </section>
  );
};

export default PrincipalActivityList;
