import React from 'react';
import '../custom-ui.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

export function Select({
  label,
  id,
  className = '',
  options,
  error,
  hint,
  ...props
}: SelectProps) {
  return (
    <div className="diws-form-group">
      {label && (
        <div className="diws-label">
          <label htmlFor={id}>
            {label} {props.required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
        </div>
      )}
      <div className="diws-input-wrapper">
        <select
          id={id}
          className={`diws-input ${error ? 'diws-input-error' : ''} ${className}`}
          style={{ appearance: 'auto' }} // Simple fallback for select arrow
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="diws-field-error">{error}</p>}
      {hint && !error && <p className="diws-field-hint">{hint}</p>}
    </div>
  );
}

export default Select;
