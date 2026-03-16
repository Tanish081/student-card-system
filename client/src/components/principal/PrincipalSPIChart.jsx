import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const PERIODS = ['Month', 'Term', 'Year'];

const defaultTrend = {
  Month: [
    { label: 'Jan', school: 638, platform: 612 },
    { label: 'Feb', school: 646, platform: 617 },
    { label: 'Mar', school: 655, platform: 621 },
    { label: 'Apr', school: 662, platform: 627 },
    { label: 'May', school: 671, platform: 633 }
  ],
  Term: [
    { label: 'T1', school: 618, platform: 598 },
    { label: 'T2', school: 642, platform: 611 },
    { label: 'T3', school: 671, platform: 626 }
  ],
  Year: [
    { label: '2022', school: 581, platform: 572 },
    { label: '2023', school: 612, platform: 594 },
    { label: '2024', school: 646, platform: 615 },
    { label: '2025', school: 671, platform: 632 }
  ]
};

const PrincipalSPIChart = ({ trendByPeriod }) => {
  const [period, setPeriod] = useState('Year');
  const dataMap = useMemo(() => trendByPeriod || defaultTrend, [trendByPeriod]);
  const data = dataMap[period] || defaultTrend.Year;

  return (
    <section className="principal-panel">
      <header className="principal-panel-header">
        <h3>School Performance Trend</h3>
        <div className="principal-tab-pills">
          {PERIODS.map((item) => (
            <button key={item} type="button" className={period === item ? 'is-active' : ''} onClick={() => setPeriod(item)}>
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="principal-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ left: 0, right: 10, top: 12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(28,43,58,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#5C6E7E', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5C6E7E', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1000]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="school" stroke="#C8922A" strokeWidth={2.5} dot={false} animationDuration={600} />
            <Line type="monotone" dataKey="platform" stroke="#1C2B3A" strokeDasharray="6 6" strokeWidth={1.4} dot={false} animationDuration={600} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="principal-chart-legend">Your school vs platform benchmark</p>
    </section>
  );
};

export default PrincipalSPIChart;
