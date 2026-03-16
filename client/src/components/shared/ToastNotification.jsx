const ToastNotification = ({ toast, onClose }) => {
  if (!toast?.message) {
    return null;
  }

  return (
    <div className={`dashboard-toast ${toast.type || 'info'}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss toast">
        x
      </button>
    </div>
  );
};

export default ToastNotification;
