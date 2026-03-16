const ErrorState = ({ message = 'Something went wrong.', retry }) => {
  return (
    <div className="state-card state-error" role="alert">
      <h3>Unable to load data</h3>
      <p>{message}</p>
      {retry ? (
        <button type="button" onClick={retry}>
          Retry
        </button>
      ) : null}
    </div>
  );
};

export default ErrorState;
