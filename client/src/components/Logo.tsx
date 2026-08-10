import React from 'react';

interface LogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  darkBg?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  darkBg = false,
  className = '' 
}) => {
  const sizeDimensions = {
    sm: { height: 32, markWidth: 32 },
    md: { height: 42, markWidth: 42 },
    lg: { height: 56, markWidth: 56 },
  };

  const dim = sizeDimensions[size];

  return (
    <div className={`diws-brand-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        width={dim.markWidth}
        height={dim.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="DIWS Logo Emblem"
      >
        <defs>
          <linearGradient id={`diwsForestGrad-${darkBg ? 'dark' : 'light'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#24543D" />
            <stop offset="100%" stopColor="#0D2218" />
          </linearGradient>

          <linearGradient id={`diwsCopperGrad-${darkBg ? 'dark' : 'light'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2A66C" />
            <stop offset="50%" stopColor="#B87333" />
            <stop offset="100%" stopColor="#8C4E18" />
          </linearGradient>

          <filter id="diwsCopperGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <polygon
          points="50,5 88,27 88,73 50,95 12,73 12,27"
          fill={`url(#diwsForestGrad-${darkBg ? 'dark' : 'light'})`}
          stroke={`url(#diwsCopperGrad-${darkBg ? 'dark' : 'light'})`}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <path
          d="M30 65 L48 40 L62 54 L76 32"
          stroke={`url(#diwsCopperGrad-${darkBg ? 'dark' : 'light'})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#diwsCopperGlow)"
        />

        <circle cx="30" cy="65" r="5" fill="#F7F4ED" stroke="#B87333" strokeWidth="3" />
        <circle cx="48" cy="40" r="5" fill="#F7F4ED" stroke="#B87333" strokeWidth="3" />
        <circle cx="62" cy="54" r="5" fill="#F7F4ED" stroke="#B87333" strokeWidth="3" />
        <circle cx="76" cy="32" r="6" fill="#D39A62" stroke="#F7F4ED" strokeWidth="2" />
      </svg>

      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: size === 'sm' ? '1.1rem' : size === 'md' ? '1.35rem' : '1.75rem',
              letterSpacing: '-0.03em',
              color: darkBg ? '#F7F4ED' : 'var(--forest-dark, #10271D)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            DIWS
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#B87333', display: 'inline-block' }} />
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: size === 'sm' ? '0.55rem' : size === 'md' ? '0.65rem' : '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: darkBg ? '#D39A62' : 'var(--copper, #B87333)',
            }}
          >
            Industrial Workflow
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
