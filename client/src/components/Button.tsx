import React from 'react';
import '../custom-ui.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClass = 'diws-btn';
  const variantClass = variant === 'primary' ? 'diws-btn-primary' : 'diws-btn-secondary';
  const widthClass = fullWidth ? 'diws-btn-full' : '';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
}
