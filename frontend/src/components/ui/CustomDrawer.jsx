import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './CustomDrawer.scss';

export function CustomDrawer({ open, onClose, title, subtitle, icon, children, width = 480 }) {
  const overlayRef = useRef(null);

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

  return (
    <div
      ref={overlayRef}
      className={`ui-drawer-overlay ${open ? 'visible' : ''}`}
      onClick={handleOverlayClick}
    >
      <aside
        className={`ui-drawer-panel ${open ? 'enter' : ''}`}
        style={{ width }}
      >
        {/* Header */}
        <div className="ui-drawer-header">
          <div className="ui-drawer-header__left">
            {icon && <div className="ui-drawer-header__icon">{icon}</div>}
            <div>
              <h3 className="ui-drawer-header__title">{title}</h3>
              {subtitle && <p className="ui-drawer-header__subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="ui-drawer-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="ui-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
