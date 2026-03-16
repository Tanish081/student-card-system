import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const RANGES = ['7D', '30D', '90D', 'All'];

const buildDefaultData = () => ({
  '7D': [
    { range: '0-200', count: 62 },
    { range: '200-400', count: 310 },
    { range: '400-600', count: 581 },
    { range: '600-800', count: 390 },
    { range: '800-1000', count: 144 }
  ],
  '30D': [
    { range: '0-200', count: 85 },
    { range: '200-400', count: 360 },
    { range: '400-600', count: 622 },
    { range: '600-800', count: 412 },
    { range: '800-1000', count: 178 }
  ],
  '90D': [
    { range: '0-200', count: 90 },
    { range: '200-400', count: 376 },
    { range: '400-600', count: 640 },
    { range: '600-800', count: 430 },
    { range: '800-1000', count: 195 }
  ],
  All: [
    { range: '0-200', count: 104 },
    { range: '200-400', count: 403 },
    { range: '400-600', count: 674 },
    { range: '600-800', count: 468 },
    { range: '800-1000', count: 225 }
  ]
});

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="admin-chart-tooltip">
      <p>{label}</p>
      <strong>{payload[0].value.toLocaleString('en-IN')} students</strong>
    </div>
  );
};

const AdminSPIChart = ({ dataByRange }) => {
  const [range, setRange] = useState('30D');
  const prepared = useMemo(() => dataByRange || buildDefaultData(), [dataByRange]);
  const chartData = prepared[range] || prepared['30D'];

  return (
    <section className="admin-panel admin-chart-panel">
      <header>
        <h3>Student Performance Distribution</h3>
        <div className="admin-tab-row" role="tablist" aria-label="SPI range">
          {RANGES.map((item) => (
            <button
              type="button"
              key={item}
              className={range === item ? 'is-active' : ''}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="admin-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 16, right: 10, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="adminSpiFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(0, 212, 180, 0.35)" />
                <stop offset="100%" stopColor="rgba(0, 212, 180, 0.02)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0, 212, 180, 0.06)" vertical={false} />
            <XAxis dataKey="range" tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00D4B4"
              strokeWidth={2}
              fill="url(#adminSpiFill)"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-pill-row">
        <span>Average SPI: 623</span>
        <span>Top 10%: above 847</span>
        <span>Below 400: 8.2%</span>
      </div>
    </section>
  );
};

export default AdminSPIChart;
