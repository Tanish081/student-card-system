const PageLoader = () => {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="page-loader-spinner" />
      <p>Resolving access...</p>
    </div>
  );
};

export default PageLoader;
