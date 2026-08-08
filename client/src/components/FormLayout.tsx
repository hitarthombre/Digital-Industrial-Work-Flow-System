import React from 'react';
import { Card } from './Card';
import '../custom-ui.css';

interface FormLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FormLayout({ title, subtitle, children }: FormLayoutProps) {
  return (
    <div className="diws-form-layout">
      <div className="diws-form-container">
        <div className="diws-form-header">
          <h2 className="diws-form-title">{title}</h2>
          {subtitle && <p className="diws-form-subtitle">{subtitle}</p>}
        </div>
        <Card>
          {children}
        </Card>
      </div>
    </div>
  );
}
