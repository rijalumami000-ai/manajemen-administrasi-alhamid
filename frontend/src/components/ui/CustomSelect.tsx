import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import './CustomSelect.scss';

export interface SelectOption {
  label: React.ReactNode;
  value: string | number | null | undefined;
}

export interface CustomSelectProps {
  label?: React.ReactNode;
  value?: string | number | null;
  onChange: (value: any) => void;
  options?: SelectOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  minWidth?: number | string;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  icon: Icon,
  disabled = false,
  error = '',
  required = false,
  allowClear = false,
  size = 'md',
  className = '',
  minWidth
}: CustomSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards?: boolean;
  }>({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 220 && rect.top > 220;

      setCoords({
        top: openUpwards ? rect.top + window.scrollY - 6 : rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, typeof minWidth === 'number' ? minWidth : 160),
        openUpwards
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const isFilled = value !== undefined && value !== null && value !== '';
  const active = open || isFilled;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div
      className={`ui-custom-select size-${size} ${open ? 'is-open' : ''} ${isFilled ? 'has-value' : ''} ${active ? 'active' : ''} ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${!label ? 'no-label' : ''} ${className}`}
      ref={containerRef}
      style={minWidth ? { minWidth, width: 'auto' } : undefined}
    >
      <div
        className="ui-custom-select__wrapper"
        onClick={() => !disabled && setOpen(!open)}
      >
        {Icon && (
          <div className="ui-custom-select__icon">
            <Icon size={size === 'sm' ? 15 : 18} />
          </div>
        )}

        <div className="ui-custom-select__value-container">
          {label && (
            <label className="ui-custom-select__label">
              {label} {required && <span className="required-asterisk">*</span>}
            </label>
          )}
          <div className="ui-custom-select__value">
            {isFilled ? (
              selectedOption?.label
            ) : (
              <span className="placeholder">{placeholder}</span>
            )}
          </div>
        </div>

        {allowClear && isFilled && !disabled ? (
          <button
            type="button"
            className="ui-custom-select__clear-btn"
            onClick={handleClear}
            aria-label="Hapus pilihan"
          >
            <X size={14} />
          </button>
        ) : (
          <div className={`ui-custom-select__arrow ${open ? 'rotated' : ''}`}>
            <ChevronDown size={size === 'sm' ? 15 : 18} />
          </div>
        )}
      </div>

      {open &&
        createPortal(
          <div
            className={`ui-custom-select__dropdown ${coords.openUpwards ? 'open-upwards' : ''}`}
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999
            }}
          >
            {options.length === 0 ? (
              <div className="ui-custom-select__option empty">Tidak ada data</div>
            ) : (
              options.map((opt) => (
                <div
                  key={String(opt.value)}
                  className={`ui-custom-select__option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="option-label-text">{opt.label}</span>
                </div>
              ))
            )}
          </div>,
          document.body
        )}

      {error && <div className="ui-custom-select__error">{error}</div>}
    </div>
  );
}

export default CustomSelect;

