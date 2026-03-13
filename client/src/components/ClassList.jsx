const ClassList = ({ classes = [] }) => (
  <section className="card">
    <h3 style={{ marginTop: 0 }}>Class List</h3>
    {classes.length ? (
      <ul style={{ margin: 0, paddingLeft: '1rem' }}>
        {classes.map((entry, index) => (
          <li key={`${entry.class || entry.role}-${index}`} style={{ marginBottom: '0.35rem' }}>
            {entry.class || 'General'} - {entry.role}
            {entry.subject ? ` (${entry.subject})` : ''}
          </li>
        ))}
      </ul>
    ) : (
      <p>No classes assigned.</p>
    )}
  </section>
);

export default ClassList;
