import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../custom-ui.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();

  const tokenFromUrl = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(!!tokenFromUrl);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyToken = async (token: string) => {
    setVerifying(true);
    setErrorMsg(null);

    try {
      const response: any = await api.get('/auth/verify-email', {
        params: { token },
      });

      if (response.success) {
        setVerified(true);
        if (user) {
          updateUser({ ...user });
        }
      } else {
        setErrorMsg(response.message || 'Email verification failed. The link may be expired.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification token is invalid or expired.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMsg(null);
    setErrorMsg(null);

    try {
      const response: any = await api.post('/auth/send-verification', {});
      if (response.success) {
        setResendMsg('A new verification email has been dispatched to your email address.');
      } else {
        setErrorMsg(response.message || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Please log in to resend your email verification link.');
    } finally {
      setResending(false);
    }
  };

  return (
    <FormLayout 
      title="Email Verification" 
      subtitle="Confirm your identity and activate full system access on DIWS"
    >
      {/* Loading state */}
      {verifying && (
        <div className="diws-text-center" style={{ padding: '2rem 1rem' }}>
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
              margin: '0 auto 1.5rem',
              animation: 'pulse 1.5s infinite'
            }}
          >
            <RefreshCw size={32} className="diws-spinner" style={{ borderColor: 'var(--copper)', borderTopColor: 'transparent' }} />
          </div>
          <h3 className="diws-font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
            Verifying Email Token...
          </h3>
          <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
            Please wait while we validate your email verification token with DIWS security servers.
          </p>
        </div>
      )}

      {/* Verified Success State */}
      {!verifying && verified && (
        <div className="diws-text-center" style={{ padding: '1rem 0' }}>
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
              margin: '0 auto 1.25rem'
            }}
          >
            <ShieldCheck size={36} />
          </div>

          <h3 className="diws-font-bold" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
            Email Verified Successfully!
          </h3>

          <p className="diws-text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Your email address has been verified. Your organization account is active and fully functional.
          </p>

          <Button 
            type="button" 
            variant="primary" 
            fullWidth 
            onClick={() => navigate('/')}
            icon={<ArrowRight size={18} />}
          >
            Go to DIWS Home Dashboard
          </Button>
        </div>
      )}

      {/* Action Prompt State when token is missing or verification failed */}
      {!verifying && !verified && (
        <div>
          {errorMsg && (
            <div className="diws-alert diws-alert-error" role="alert">
              <AlertCircle className="diws-alert-icon" size={18} />
              <div>{errorMsg}</div>
            </div>
          )}

          {resendMsg && (
            <div className="diws-alert diws-alert-success" role="alert">
              <CheckCircle2 className="diws-alert-icon" size={18} />
              <div>{resendMsg}</div>
            </div>
          )}

          <div className="diws-text-center" style={{ marginBottom: '1.5rem' }}>
            <div 
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                backgroundColor: 'var(--cream)', 
                color: 'var(--copper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <Mail size={28} />
            </div>

            <h3 className="diws-font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
              Check Your Inbox
            </h3>

            <p className="diws-text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              We sent a verification link to your registered email address {user?.email ? <strong>({user.email})</strong> : ''}. 
              Please click the link inside to verify your email.
            </p>
          </div>

          <div className="diws-flex diws-flex-col diws-gap-3 diws-mt-6">
            {isAuthenticated ? (
              <Button 
                type="button" 
                variant="copper" 
                fullWidth 
                loading={resending} 
                onClick={handleResendVerification}
                icon={<RefreshCw size={18} />}
              >
                Resend Verification Email
              </Button>
            ) : (
              <Link to="/login" className="diws-btn diws-btn-primary diws-btn-full" style={{ textDecoration: 'none' }}>
                Log In to Resend Verification Link
              </Link>
            )}

            <div className="diws-text-center diws-mt-4">
              <Link to="/" className="diws-link diws-text-sm">
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </FormLayout>
  );
}
