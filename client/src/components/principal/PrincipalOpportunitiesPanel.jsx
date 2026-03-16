import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const PrincipalOpportunitiesPanel = ({ data = [], stats }) => {
  return (
    <section className="principal-panel">
      <header className="principal-panel-header">
        <h3>Opportunities - Student Engagement</h3>
      </header>

      <p className="principal-opportunity-mini">
        Posted this month: {stats.posted} · Applications received: {stats.applications} · Selected: {stats.selected}
      </p>

      {data.length ? (
        <div className="principal-chart-wrap small">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ top: 6, right: 8, left: 12, bottom: 4 }}>
              <CartesianGrid stroke="rgba(28,43,58,0.08)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fill: '#5C6E7E', fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="applications" fill="#C8922A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-empty-state small">
          <h4>No opportunity data yet</h4>
          <p>Post your first opportunity to track engagement trends.</p>
        </div>
      )}
    </section>
  );
};

export default PrincipalOpportunitiesPanel;
