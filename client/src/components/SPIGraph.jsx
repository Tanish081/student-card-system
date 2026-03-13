import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const SPIGraph = ({ spi }) => {
  if (!spi) return null;

  const data = [
    { metric: 'Academic', score: spi.academicScore },
    { metric: 'Sports', score: spi.sportsScore },
    { metric: 'Activity', score: spi.activityScore },
    { metric: 'Participation', score: spi.participationScore },
    { metric: 'SPI', score: spi.spi }
  ];

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>SPI Breakdown</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default SPIGraph;
