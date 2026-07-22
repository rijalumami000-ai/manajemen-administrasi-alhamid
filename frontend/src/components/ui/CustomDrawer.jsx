import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './CustomDrawer.scss';

export function CustomDrawer({
  open,
  onClose,
  title,
  children,
  placement = 'left',
  width = 280
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="custom-drawer-overlay" onClick={onClose}>
      <div
        className={`custom-drawer-panel drawer-${placement}`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-drawer-header">
          {title && <h3 className="custom-drawer-title">{title}</h3>}
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="custom-drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
}
