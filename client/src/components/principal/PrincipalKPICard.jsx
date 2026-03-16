import CountUpNumber from '../shared/CountUpNumber';

const PrincipalKPICard = ({ item, index }) => {
  const cardTone = item.variant || 'default';

  return (
    <article className={`principal-kpi-card ${cardTone}`} style={{ animationDelay: `${500 + index * 100}ms` }}>
      <p>{item.label}</p>
      <h3>
        <CountUpNumber value={item.value} delay={650 + index * 90} />
        {item.suffix || ''}
      </h3>
      <small className={item.trendTone || 'neutral'}>{item.trend}</small>
      <div className="principal-kpi-progress">
        <span style={{ width: `${Math.min(100, Math.max(8, item.progress || 0))}%` }} />
      </div>
    </article>
  );
};

export default PrincipalKPICard;
