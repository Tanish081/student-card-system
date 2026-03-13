const AchievementTable = ({ achievements = [] }) => (
  <section className="card">
    <h3 style={{ marginTop: 0 }}>Achievements</h3>
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Category</th>
            <th>Level</th>
            <th>Position</th>
            <th>Points</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {achievements.length ? (
            achievements.map((item) => (
              <tr key={item._id}>
                <td>{item.eventName}</td>
                <td>{item.category}</td>
                <td>{item.level}</td>
                <td>{item.position}</td>
                <td>{item.points}</td>
                <td>{item.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>No achievements found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default AchievementTable;
