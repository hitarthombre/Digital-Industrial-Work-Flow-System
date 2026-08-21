import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'copper';
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: 'var(--success-bg, #F0FDF4)', color: 'var(--success-color, #166534)', border: '1px solid var(--success-border, #86EFAC)' };
      case 'warning':
        return { backgroundColor: 'var(--warning-bg, #FFFBEB)', color: 'var(--warning-color, #92400E)', border: '1px solid var(--warning-border, #FDE68A)' };
      case 'error':
        return { backgroundColor: 'var(--error-bg, #FEF2F2)', color: 'var(--error-color, #991B1B)', border: '1px solid var(--error-border, #FCA5A5)' };
      case 'primary':
        return { backgroundColor: 'rgba(23, 58, 42, 0.1)', color: 'var(--forest, #173A2A)', border: '1px solid rgba(23, 58, 42, 0.2)' };
      case 'copper':
        return { backgroundColor: 'rgba(184, 115, 51, 0.1)', color: 'var(--copper, #B87333)', border: '1px solid rgba(184, 115, 51, 0.2)' };
      case 'neutral':
      default:
        return { backgroundColor: 'var(--cream, #EFEAE0)', color: 'var(--text-muted, #66736A)', border: '1px solid var(--border-color, #D8D3C8)' };
    }
  };

  return (
    <span
      className={`diws-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getStyles(),
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
