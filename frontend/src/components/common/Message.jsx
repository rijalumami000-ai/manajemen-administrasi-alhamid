export function Message({ type = 'info', message, onClose }) {
  if (!message) return null;

  const typeClass = type === 'error' ? 'message-error' :
                    type === 'success' ? 'message-success' :
                    type === 'warning' ? 'message-warning' :
                    'message-info';

  return (
    <div className={`message ${typeClass}`}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className="message-close"
          onClick={onClose}
          aria-label="Close message"
        >
          &times;
        </button>
      )}
    </div>
  );
}
