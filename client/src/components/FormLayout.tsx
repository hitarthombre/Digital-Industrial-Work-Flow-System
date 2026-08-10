import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { Logo } from './Logo';
import '../custom-ui.css';

interface FormLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  showLogo?: boolean;
}

export function FormLayout({ 
  title, 
  subtitle, 
  children, 
  wide = false,
  showLogo = true 
}: FormLayoutProps) {
  return (
    <div className="diws-form-layout">
      <div className={`diws-form-container ${wide ? 'diws-form-container-wide' : ''}`}>
        <div className="diws-form-header">
          {showLogo && (
            <Link to="/" className="diws-form-logo" aria-label="Go to DIWS Home">
              <Logo variant="full" size="md" />
            </Link>
          )}
          <h1 className="diws-form-title">{title}</h1>
          {subtitle && <p className="diws-form-subtitle">{subtitle}</p>}
        </div>
        <Card>
          {children}
        </Card>
      </div>
    </div>
  );
}

export default FormLayout;
