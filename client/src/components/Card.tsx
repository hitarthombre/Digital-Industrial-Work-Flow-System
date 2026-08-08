import React from 'react';
import '../custom-ui.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`diws-card ${className}`}>
      {children}
    </div>
  );
}
