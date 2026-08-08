import React from 'react';
import '../custom-ui.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div className="diws-form-group">
      <label htmlFor={id} className="diws-label">
        {label}
      </label>
      <input
        id={id}
        className={`diws-input ${className}`}
        {...props}
      />
    </div>
  );
}
