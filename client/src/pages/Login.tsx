import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../custom-ui.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Retrieve redirect target from state if available
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response: any = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        login(token, user);
        
        if (rememberMe) {
          localStorage.setItem('diws_remember_email', email);
        } else {
          localStorage.removeItem('diws_remember_email');
        }

        navigate(from, { replace: true });
      } else {
        setErrorMsg(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout 
      title="Welcome Back" 
      subtitle="Log in to access your Digital Industrial Workflow dashboard"
    >
      {errorMsg && (
        <div className="diws-alert diws-alert-error" role="alert">
          <AlertCircle className="diws-alert-icon" size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

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
          autoComplete="email"
        />

        <Input 
          label="Password" 
          id="password" 
          type={showPassword ? "text" : "password"} 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          rightLabelAction={
            <Link to="/forgot-password" className="diws-link diws-text-xs">
              Forgot password?
            </Link>
          }
          required 
          autoComplete="current-password"
        />

        <div className="diws-flex diws-justify-between diws-items-center" style={{ margin: '1.25rem 0' }}>
          <label className="diws-flex diws-items-center diws-gap-2 diws-text-sm" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--copper)', cursor: 'pointer' }} 
            />
            Remember me on this device
          </label>
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LogIn size={18} />}>
          Log In
        </Button>
      </form>

      <div className="diws-text-center diws-mt-6" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" className="diws-link">Register company & account</Link>
        </p>
      </div>
    </FormLayout>
  );
}
