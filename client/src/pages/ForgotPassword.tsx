import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../services/api';
import '../custom-ui.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const response: any = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setSubmitted(true);
        if (response.data && response.data.resetToken) {
          setResetToken(response.data.resetToken);
        }
      } else {
        setErrorMsg(response.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while sending the reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout 
      title="Reset Password" 
      subtitle="Enter your account email to receive a password reset link"
    >
      {errorMsg && (
        <div className="diws-alert diws-alert-error" role="alert">
          <AlertCircle className="diws-alert-icon" size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {submitted ? (
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
            Reset Instructions Dispatched
          </h3>

          <p className="diws-text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and click the link to reset your password.
          </p>

          {resetToken && (
            <div className="diws-alert diws-alert-warning" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <KeyRound size={20} className="diws-alert-icon" />
              <div>
                <strong>Development Reset Link Available:</strong>
                <p className="diws-text-xs" style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>
                  Token generated: <code>{resetToken}</code>
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <Link 
                    to={`/reset-password?token=${resetToken}`} 
                    className="diws-btn diws-btn-copper" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Click to Open Reset Password Page
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="diws-flex diws-flex-col diws-gap-3 diws-mt-6">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => { setSubmitted(false); setResetToken(null); }}
              icon={<Mail size={16} />}
            >
              Resend with another email
            </Button>

            <Link to="/login" className="diws-link diws-text-sm" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input 
            label="Email Address" 
            id="email" 
            type="email" 
            placeholder="admin@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required 
            autoFocus
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} icon={<Send size={18} />}>
            Send Reset Link
          </Button>

          <div className="diws-text-center diws-mt-6">
            <Link to="/login" className="diws-link diws-text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </FormLayout>
  );
}
