import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { User as UserIcon, LogOut, LogIn } from "lucide-react";

function Navbar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* BRAND LOGO */}
        <Link to="/" className="logo-link" style={{ textDecoration: 'none' }}>
          <Logo variant="full" size="sm" darkBg />
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          {isAuthenticated && (
            <Link to="/app/dashboard" style={{ color: '#D39A62', fontWeight: 700 }}>
              Dashboard
            </Link>
          )}
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/terms">Terms</Link>
        </div>

        {/* USER AUTH ACTIONS / CTA */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <Link 
                to="/app/dashboard"
                title="Go to Dashboard"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: '#F7F4ED',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = '#D39A62';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <UserIcon size={16} style={{ color: '#D39A62' }} />
                <span>{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}</span>
              </Link>

              <Link 
                to="/logout" 
                className="nav-button"
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid rgba(255,255,255,0.25)', 
                  color: '#F7F4ED',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem'
                }}
              >
                <LogOut size={16} />
                Log Out
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link 
                to="/login" 
                style={{ 
                  color: '#F7F4ED', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.75rem'
                }}
              >
                <LogIn size={16} />
                Log In
              </Link>

              <Link to="/register" className="nav-button">
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;