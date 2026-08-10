import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../custom-ui.css';

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performLogout = async () => {
      try {
        await api.post('/auth/logout', {});
      } catch (_) {
        // Ignore network/server errors during session termination
      } finally {
        logout();
        if (isMounted) {
          setCompleted(true);
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1200);
        }
      }
    };

    performLogout();

    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  return (
    <FormLayout 
      title="Logging Out" 
      subtitle="Safely terminating your active DIWS session"
    >
      <div className="diws-text-center" style={{ padding: '2rem 1rem' }}>
        {!completed ? (
          <>
            <div 
              style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                backgroundColor: 'var(--cream)', 
                color: 'var(--copper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <LogOut size={32} className="diws-spinner" style={{ borderColor: 'var(--copper)', borderTopColor: 'transparent' }} />
            </div>

            <h3 className="diws-font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
              Closing Session...
            </h3>

            <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
              Clearing authentication tokens and securing workspace session state.
            </p>
          </>
        ) : (
          <>
            <div 
              style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                backgroundColor: 'var(--success-bg)', 
                color: 'var(--success-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 className="diws-font-bold" style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
              Session Terminated
            </h3>

            <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
              You have been logged out. Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </FormLayout>
  );
}
