import { useState } from 'react';
import './FloatingInput.scss';

export function FloatingInput({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  disabled = false,
  error = '',
  name,
  required = false
}) {
  const [focused, setFocused] = useState(false);
  const isFilled = value !== undefined && value !== null && value.toString().length > 0;
  const active = focused || isFilled;

  return (
    <div className={`ui-floating-input ${active ? 'active' : ''} ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${Icon ? 'has-icon' : ''}`}>
      <div className="ui-floating-input__wrapper">
        {Icon && <div className="ui-floating-input__icon"><Icon size={18} /></div>}
        <input
          type={type}
          name={name}
          className="ui-floating-input__field"
          value={value || ''}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
        />
        <label className="ui-floating-input__label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      </div>
      {error && <div className="ui-floating-input__error">{error}</div>}
    </div>
  );
}
