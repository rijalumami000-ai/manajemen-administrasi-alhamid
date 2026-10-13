import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './CustomModal.scss';

export function CustomModal({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  onOk,
  okText = 'Simpan',
  okLoading = false,
  onCancel,
  cancelText = 'Batal',
  width = 560,
  size,
  destroyOnClose = false,
  className = '',
}) {
  const isActuallyOpen = Boolean(open ?? isOpen);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  const handleEsc = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isActuallyOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isActuallyOpen, handleEsc]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!isActuallyOpen && destroyOnClose) return null;

  const sizeWidth = size === 'lg' ? 720 : size === 'sm' ? 420 : width;

  return (
    <div
      ref={overlayRef}
      className={`ui-modal-overlay ${isActuallyOpen ? 'visible' : ''} ${className}`}
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={`ui-modal-container ${isActuallyOpen ? 'enter' : 'exit'}`}
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
        {footer !== undefined ? (
          footer && <div className="ui-modal-footer">{footer}</div>
        ) : onOk ? (
          <div className="ui-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={onCancel || onClose}
              disabled={okLoading}
              style={{ minWidth: 84 }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="btn-custom btn-primary"
              onClick={onOk}
              disabled={okLoading}
              style={{ minWidth: 96, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {okLoading ? (
                <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
              ) : null}
              <span>{okText}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
