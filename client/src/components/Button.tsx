import React from 'react';
import '../custom-ui.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'copper' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false, 
  loading = false,
  icon,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClass = 'diws-btn';
  const variantClasses = {
    primary: 'diws-btn-primary',
    copper: 'diws-btn-copper',
    secondary: 'diws-btn-secondary',
    outline: 'diws-btn-outline',
    danger: 'diws-btn-danger',
  };
  
  const variantClass = variantClasses[variant] || 'diws-btn-primary';
  const widthClass = fullWidth ? 'diws-btn-full' : '';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`.trim()} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="diws-spinner" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export default Button;
