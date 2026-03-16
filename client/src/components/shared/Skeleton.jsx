export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line w-40" />
      <div className="skeleton-number" />
      <div className="skeleton-line w-60" />
    </div>
  );
};

export const SkeletonRow = () => <div className="skeleton-row" />;

export const SkeletonChart = () => <div className="skeleton-chart" />;

export const SkeletonText = () => <div className="skeleton-line" />;
