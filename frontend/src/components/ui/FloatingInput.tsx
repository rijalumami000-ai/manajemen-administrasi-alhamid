import React, { useState, ChangeEvent, InputHTMLAttributes, ComponentType } from 'react';
import './FloatingInput.scss';

export interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  error?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

export function FloatingInput({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  disabled = false,
  error = '',
  name,
  required = false,
  className = '',
  ...rest
}: FloatingInputProps) {
  const [focused, setFocused] = useState<boolean>(false);
  const isFilled = value !== undefined && value !== null && value.toString().length > 0;
  const active = focused || isFilled;

  return (
    <div
      className={`ui-floating-input ${focused ? 'is-focused' : ''} ${isFilled ? 'has-value' : ''} ${
        active ? 'active' : ''
      } ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${Icon ? 'has-icon' : ''} ${className}`}
    >
      <div className="ui-floating-input__wrapper">
        {Icon && (
          <div className="ui-floating-input__icon">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          className="ui-floating-input__field"
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
          {...rest}
        />
        <label className="ui-floating-input__label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
      </div>
      {error && <div className="ui-floating-input__error">{error}</div>}
    </div>
  );
}

export default FloatingInput;
