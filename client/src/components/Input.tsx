import React from 'react';
import '../custom-ui.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
  rightLabelAction?: React.ReactNode;
}

export function Input({ 
  label, 
  id, 
  className = '', 
  error,
  hint,
  icon,
  actionButton,
  rightLabelAction,
  ...props 
}: InputProps) {
  return (
    <div className="diws-form-group">
      <div className="diws-label">
        <label htmlFor={id}>
          {label} {props.required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
        {rightLabelAction}
      </div>
      <div className="diws-input-wrapper">
        {icon && <span className="diws-input-icon">{icon}</span>}
        <input
          id={id}
          className={`diws-input ${icon ? 'diws-input-with-icon' : ''} ${actionButton ? 'diws-input-with-action' : ''} ${error ? 'diws-input-error' : ''} ${className}`}
          {...props}
        />
        {actionButton}
      </div>
      {error && <p className="diws-field-error">{error}</p>}
      {hint && !error && <p className="diws-field-hint">{hint}</p>}
    </div>
  );
}

export default Input;
