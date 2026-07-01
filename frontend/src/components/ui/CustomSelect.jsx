import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import './CustomSelect.scss';

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
  allowClear = false
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
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
      // Listen to scroll events on any element (useCapture = true) to keep position synced
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open]);

  const selectedOption = options.find(opt => opt.value == value);
  const isFilled = value !== undefined && value !== null && value !== '';
  const active = open || isFilled;

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div 
      className={`ui-custom-select ${active ? 'active' : ''} ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${!label ? 'no-label' : ''}`}
      ref={containerRef}
    >
      <div 
        className="ui-custom-select__wrapper" 
        onClick={() => !disabled && setOpen(!open)}
      >
        {Icon && <div className="ui-custom-select__icon"><Icon size={18} /></div>}
        
        <div className="ui-custom-select__value-container">
          {label && (
            <label className="ui-custom-select__label">
              {label} {required && <span className="required-asterisk">*</span>}
            </label>
          )}
          <div className="ui-custom-select__value">
            {isFilled ? selectedOption?.label : <span className="placeholder">{placeholder}</span>}
          </div>
        </div>

        {allowClear && isFilled && !disabled ? (
          <button
            type="button"
            className="ui-custom-select__clear-btn"
            onClick={handleClear}
            aria-label="Hapus pilihan"
          >
            <X size={16} />
          </button>
        ) : (
          <div className={`ui-custom-select__arrow ${open ? 'rotated' : ''}`}>
            <ChevronDown size={18} />
          </div>
        )}
      </div>

      {open && createPortal(
        <div 
          className="ui-custom-select__dropdown"
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
                key={opt.value}
                className={`ui-custom-select__option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
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
