const scoreTone = (score) => {
  if (score < 400) return 'low';
  if (score < 600) return 'mid';
  return 'high';
};

const PrincipalStudentTable = ({ students = [] }) => {
  return (
    <section className="principal-panel">
      <header className="principal-panel-header">
        <h3>Students Needing Attention</h3>
        <button type="button">View all {'->'}</button>
      </header>
      <p className="principal-subhead">Sorted by SPI - lowest performing this month</p>

      {students.length ? (
        <div className="principal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>SPI</th>
                <th>Trend</th>
                <th>Last Achievement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.uid}>
                  <td>{student.name}</td>
                  <td>{student.className}</td>
                  <td><span className={`principal-score ${scoreTone(student.spi)}`}>{student.spi}</span></td>
                  <td className={`principal-trend ${student.trend}`}>{student.trendSymbol}</td>
                  <td>{student.lastAchievement}</td>
                  <td>
                    <button type="button" className={student.spi < 400 ? 'contact' : 'view'}>
                      {student.spi < 400 ? 'Contact' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-empty-state small">
          <h4>No students flagged</h4>
          <p>Support queue will appear as soon as SPI drops below threshold.</p>
        </div>
      )}
    </section>
  );
};

export default PrincipalStudentTable;
