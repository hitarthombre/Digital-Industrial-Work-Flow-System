import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../services/api';
import '../custom-ui.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Password strength logic
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = calculatePasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 1: return { text: 'Weak', color: '#EF4444', percent: '25%' };
      case 2: return { text: 'Fair', color: '#F59E0B', percent: '50%' };
      case 3: return { text: 'Good', color: '#3B82F6', percent: '75%' };
      case 4: return { text: 'Strong', color: '#10B981', percent: '100%' };
      default: return { text: '', color: '#D8D3C8', percent: '0%' };
    }
  };

  const strengthInfo = getStrengthLabel(strengthScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token.trim()) {
      setErrorMsg('Reset token is required. Please access this page using your password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response: any = await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setErrorMsg(response.message || 'Password reset failed. The link may be invalid or expired.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed. Token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout 
      title="Create New Password" 
      subtitle="Choose a secure password for your DIWS account"
    >
      {!tokenFromUrl && !success && (
        <div className="diws-alert diws-alert-warning" role="alert">
          <KeyRound className="diws-alert-icon" size={18} />
          <div>
            No reset token found in URL parameters. Please check your reset email or enter your token below.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="diws-alert diws-alert-error" role="alert">
          <AlertCircle className="diws-alert-icon" size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {success ? (
        <div className="diws-text-center">
          <div 
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              backgroundColor: 'var(--success-bg)', 
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3 className="diws-font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
            Password Reset Successful!
          </h3>

          <p className="diws-text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Your account password has been updated successfully. You can now log in using your new credentials.
          </p>

          <Button 
            type="button" 
            variant="primary" 
            fullWidth 
            onClick={() => navigate('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {!tokenFromUrl && (
            <Input 
              label="Reset Token" 
              id="token" 
              type="text" 
              placeholder="Paste reset token here" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              icon={<KeyRound size={18} />}
              required 
            />
          )}

          <div>
            <Input 
              label="New Password" 
              id="newPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock size={18} />}
              actionButton={
                <button 
                  type="button" 
                  className="diws-input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required 
            />
            {newPassword && (
              <div className="diws-password-meter">
                <div className="diws-password-bar-bg">
                  <div 
                    className="diws-password-bar-fill"
                    style={{ width: strengthInfo.percent, backgroundColor: strengthInfo.color }}
                  />
                </div>
                <div className="diws-password-label">
                  <span>Strength: {strengthInfo.text}</span>
                  <span>Min 6 characters</span>
                </div>
              </div>
            )}
          </div>

          <Input 
            label="Confirm New Password" 
            id="confirmPassword" 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={18} />}
            required 
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} icon={<CheckCircle2 size={18} />}>
            Reset Password
          </Button>

          <div className="diws-text-center diws-mt-6">
            <Link to="/login" className="diws-link diws-text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        </form>
      )}
    </FormLayout>
  );
}
