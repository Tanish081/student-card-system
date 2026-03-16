import CountUpNumber from '../shared/CountUpNumber';
import SparkLine from '../shared/SparkLine';

const ICONS = {
  students: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5z" />,
  trophy: <path d="M7 4h10v2h2a2 2 0 010 4 4 4 0 01-4 4h-1v2h3v2H7v-2h3v-2H9a4 4 0 01-4-4 2 2 0 010-4h2V4z" />,
  shield: <path d="M12 2L4 6v6c0 5.2 3.3 9.9 8 11 4.7-1.1 8-5.8 8-11V6l-8-4z" />,
  building: <path d="M4 20V5l8-3 8 3v15h-6v-5h-4v5H4z" />,
  queue: <path d="M5 6h14v2H5zm0 5h14v2H5zm0 5h8v2H5z" />,
  qr: <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm11 0h2v2h-2zm3 0h2v2h-2zm-3 3h5v2h-5z" />
};

const AdminKPICard = ({ item, index }) => {
  const isAlert = item.accent === 'amber';
  const deltaClass = item.deltaTone || (isAlert ? 'warn' : 'up');

  return (
    <article className={`admin-kpi-card ${isAlert ? 'is-amber' : ''}`} style={{ animationDelay: `${300 + index * 80}ms` }}>
      <div className="admin-kpi-head">
        <span className="admin-kpi-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">{ICONS[item.icon] || ICONS.students}</svg>
        </span>
        <p>{item.label}</p>
      </div>

      <div className="admin-kpi-value-row">
        <CountUpNumber
          className="admin-kpi-value"
          value={item.value}
          delay={400 + index * 100}
          suffix={item.suffix || ''}
        />
        <SparkLine points={item.trend || []} color={isAlert ? '#F4A623' : '#00D4B4'} />
      </div>

      <p className={`admin-kpi-delta ${deltaClass}`}>{item.delta}</p>
    </article>
  );
};

export default AdminKPICard;
