const SparkLine = ({ points = [], width = 46, height = 20, color = '#00D4B4' }) => {
  if (!points.length) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * width;
      const y = height - (((point - min) / range) * (height - 3) + 1.5);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="spark-line" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export default SparkLine;
