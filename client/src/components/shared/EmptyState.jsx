const EmptyState = ({ title = 'No data found', message = 'Try adjusting filters.', ctaLabel, onCta }) => {
  return (
    <div className="state-card state-empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {ctaLabel && onCta ? (
        <button type="button" onClick={onCta}>
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
