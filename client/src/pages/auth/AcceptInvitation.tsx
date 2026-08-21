import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../../components/Logo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [invitedRole, setInvitedRole] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        setTokenValid(false);
        return;
      }
      
      try {
        // Simulate GET /api/users/invite/verify/:token
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock successful validation
        if (token.length > 5) {
          setTokenValid(true);
          setInvitedEmail('new.user@example.com');
          setInvitedRole('Employee');
        } else {
          setTokenValid(false);
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !password || !confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulate POST /api/users/invite/accept
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError('Failed to setup your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="diws-form-layout">
        <div className="diws-spinner" style={{ borderColor: 'var(--copper)', borderTopColor: 'transparent', width: '48px', height: '48px' }}></div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="diws-form-layout">
        <div className="diws-form-container diws-card diws-flex-col diws-items-center diws-text-center">
          <Logo className="diws-form-logo diws-mb-4" size="md" />
          <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>
            <AlertCircle size={64} />
          </div>
          <h2 className="diws-form-title">Invalid Invitation Link</h2>
          <p className="diws-form-subtitle diws-mb-4">
            This invitation link is invalid, expired, or has already been used. Please request a new invitation from your company administrator.
          </p>
          <Link to="/login">
            <Button variant="primary">Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="diws-form-layout">
        <div className="diws-form-container diws-card diws-flex-col diws-items-center diws-text-center">
          <Logo className="diws-form-logo diws-mb-4" size="md" />
          <div style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>
            <CheckCircle2 size={64} />
          </div>
          <h2 className="diws-form-title">Account Created!</h2>
          <p className="diws-form-subtitle diws-mb-4">
            Your account has been successfully set up. Redirecting you to the login page...
          </p>
          <Link to="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="diws-form-layout">
      <div className="diws-form-container-wide">
        <div className="diws-form-header">
          <Link to="/">
            <Logo className="diws-form-logo" size="lg" />
          </Link>
          <h1 className="diws-form-title">Accept Invitation</h1>
          <p className="diws-form-subtitle">Complete your profile to join the workspace.</p>
        </div>

        <div className="diws-card">
          <div className="diws-flex diws-items-center diws-justify-between" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>INVITED EMAIL</div>
              <div style={{ fontWeight: 600, color: 'var(--forest-dark)' }}>{invitedEmail}</div>
            </div>
            <div className="diws-text-right">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ASSIGNED ROLE</div>
              <Badge variant="copper">{invitedRole}</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="diws-grid gap-4">
            {error && (
              <div className="diws-alert diws-alert-error">
                <AlertCircle size={18} className="diws-alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="diws-grid-2">
              <Input
                label="First Name"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                icon={<User size={18} />}
                required
              />
              <Input
                label="Last Name"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                icon={<User size={18} />}
                required
              />
            </div>

            <Input
              label="Phone Number (Optional)"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={18} />}
            />

            <div className="diws-grid-2">
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                hint="Minimum 6 characters"
                required
              />
              <Input
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={18} />}
                required
              />
            </div>

            <Button type="submit" variant="primary" loading={isSubmitting} fullWidth className="diws-mt-4">
              Complete Setup & Join
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
