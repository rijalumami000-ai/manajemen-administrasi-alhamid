import React, { useEffect, ReactNode, MouseEvent } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  size?: 'default' | 'small' | 'wide' | 'large' | string;
}

export function Modal({ isOpen, onClose, title, children, size = 'default' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass =
    size === 'small'
      ? 'modal-content-small'
      : size === 'wide'
      ? 'modal-content-wide'
      : size === 'large'
      ? 'modal-content-large'
      : 'modal-content';

  return (
    <div className="modal" onClick={onClose}>
      <div className={sizeClass} onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className="modal-header">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
