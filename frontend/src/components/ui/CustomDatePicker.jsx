import React from 'react';
import { Calendar } from 'lucide-react';
import './CustomDatePicker.scss';

export function CustomDatePicker({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'YYYY-MM-DD',
  name,
  min,
  max
}) {
  return (
    <div className={`custom-datepicker-group ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
      {label && (
        <label className="datepicker-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
      )}

      <div className="datepicker-wrapper">
        <span className="datepicker-icon">
          <Calendar size={18} />
        </span>
        <input
          type="date"
          name={name}
          className="custom-datepicker-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          placeholder={placeholder}
        />
      </div>

      {error && <span className="datepicker-error-text">{error}</span>}
    </div>
  );
}
