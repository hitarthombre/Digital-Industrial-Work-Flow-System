import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import '../custom-ui.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div 
      className="diws-form-layout"
      style={{ 
        minHeight: 'calc(100vh - 10rem)', 
        padding: '3rem 1.5rem',
        background: 'radial-gradient(circle at 50% 30%, rgba(23, 58, 42, 0.06) 0%, transparent 70%)' 
      }}
    >
      <div className="diws-form-container diws-form-container-wide">
        
        {/* Header Logo */}
        <div className="diws-form-header">
          <Link to="/" className="diws-form-logo" aria-label="Go to DIWS Home">
            <Logo variant="full" size="md" />
          </Link>
        </div>

        {/* 404 Card Container */}
        <div className="diws-card diws-text-center" style={{ padding: '3.5rem 2rem' }}>
          
          {/* Badge & Icon */}
          <div 
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              backgroundColor: 'var(--cream, #EFEAE0)', 
              color: 'var(--copper, #B87333)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(184, 115, 51, 0.15)',
              border: '2px solid rgba(184, 115, 51, 0.2)'
            }}
          >
            <FileQuestion size={44} strokeWidth={1.75} />
          </div>

          {/* Error Code & Heading */}
          <p className="section-label" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            ERROR CODE 404
          </p>

          <h1 
            style={{ 
              fontSize: 'clamp(2rem, 5vw, 2.75rem)', 
              fontWeight: 800, 
              color: 'var(--forest-dark, #10271D)',
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem'
            }}
          >
            Workflow Route Not Found
          </h1>

          <p 
            className="diws-text-sm" 
            style={{ 
              color: 'var(--text-muted, #66736A)', 
              maxWidth: 480, 
              margin: '0 auto 2rem',
              lineHeight: 1.6,
              fontSize: '1rem'
            }}
          >
            The page or workspace endpoint you are attempting to access does not exist, has been moved, or requires elevated permissions.
          </p>

          {/* Action Buttons */}
          <div 
            className="diws-flex diws-justify-center diws-gap-3" 
            style={{ flexWrap: 'wrap', marginBottom: '2.5rem' }}
          >
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={18} />}
            >
              Go Back
            </Button>

            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button type="button" variant="primary" icon={<Home size={18} />}>
                Return to Dashboard
              </Button>
            </Link>

            <Link to="/contact" style={{ textDecoration: 'none' }}>
              <Button type="button" variant="outline" icon={<HelpCircle size={18} />}>
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Quick Helpful Links */}
          <div 
            style={{ 
              paddingTop: '1.75rem', 
              borderTop: '1px solid var(--border-color, #D8D3C8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Looking for something specific?
            </span>
            
            <div className="diws-flex diws-gap-4 diws-text-sm" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/features" className="diws-link">System Features</Link>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <Link to="/pricing" className="diws-link">Pricing Plans</Link>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <Link to="/login" className="diws-link">User Login</Link>
              <span style={{ color: 'var(--border-color)' }}>•</span>
              <Link to="/register" className="diws-link">Company Onboarding</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
