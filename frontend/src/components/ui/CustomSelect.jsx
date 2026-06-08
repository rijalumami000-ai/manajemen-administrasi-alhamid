import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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
  required = false
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const isFilled = value !== undefined && value !== null && value !== '';
  const active = open || isFilled;

  return (
    <div 
      className={`ui-custom-select ${active ? 'active' : ''} ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}
      ref={containerRef}
    >
      <div 
        className="ui-custom-select__wrapper" 
        onClick={() => !disabled && setOpen(!open)}
      >
        {Icon && <div className="ui-custom-select__icon"><Icon size={18} /></div>}
        
        <div className="ui-custom-select__value-container">
          <label className="ui-custom-select__label">
            {label} {required && <span className="required-asterisk">*</span>}
          </label>
          <div className="ui-custom-select__value">
            {isFilled ? selectedOption?.label : <span className="placeholder">{placeholder}</span>}
          </div>
        </div>

        <div className={`ui-custom-select__arrow ${open ? 'rotated' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </div>

      {open && (
        <div className="ui-custom-select__dropdown">
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
        </div>
      )}
      
      {error && <div className="ui-custom-select__error">{error}</div>}
    </div>
  );
}
