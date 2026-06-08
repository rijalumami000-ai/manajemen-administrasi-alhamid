import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './CustomModal.scss';

export function CustomModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = 560,
  size,
  destroyOnClose = false,
  className = '',
}) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  const handleEsc = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!open && destroyOnClose) return null;

  const sizeWidth = size === 'lg' ? 720 : size === 'sm' ? 420 : width;

  return (
    <div
      ref={overlayRef}
      className={`ui-modal-overlay ${open ? 'visible' : ''} ${className}`}
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={`ui-modal-container ${open ? 'enter' : 'exit'}`}
        style={{ maxWidth: sizeWidth }}
      >
        {/* Header */}
        <div className="ui-modal-header">
          <div className="ui-modal-header__left">
            {icon && <div className="ui-modal-header__icon">{icon}</div>}
            <div>
              <h3 className="ui-modal-header__title">{title}</h3>
              {subtitle && <p className="ui-modal-header__subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ui-modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
