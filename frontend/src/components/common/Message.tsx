import React, { ReactNode } from 'react';

export interface MessageProps {
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  message?: ReactNode;
  onClose?: () => void;
}

export function Message({ type = 'info', message, onClose }: MessageProps) {
  if (!message) return null;

  const typeClass =
    type === 'error'
      ? 'message-error'
      : type === 'success'
      ? 'message-success'
      : type === 'warning'
      ? 'message-warning'
      : 'message-info';

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

export default Message;
