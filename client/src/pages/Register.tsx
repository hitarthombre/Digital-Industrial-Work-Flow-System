import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, 
  Hash, 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../custom-ui.css';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    industry: 'Manufacturing',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  // Calculate Password Strength (0 to 4)
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = calculatePasswordStrength(formData.password);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'companyCode' ? value.toUpperCase() : val,
    }));

    if (errorMsg) setErrorMsg(null);
  };

  // Auto-generate Company Code recommendation from Company Name if empty
  const handleCompanyNameBlur = () => {
    if (formData.companyName && !formData.companyCode) {
      const generated = formData.companyName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 6)
        .toUpperCase();
      setFormData((prev) => ({ ...prev, companyCode: generated }));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || formData.companyName.length < 2) {
      setErrorMsg('Company name must be at least 2 characters.');
      return;
    }
    if (!formData.companyCode || formData.companyCode.length < 2) {
      setErrorMsg('Company code must be at least 2 characters.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        companyCode: formData.companyCode.trim().toUpperCase(),
        industry: formData.industry,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      };

      const response: any = await api.post('/auth/register', payload);

      if (response.success && response.data) {
        const { token, user, verificationToken } = response.data;
        
        // Log in user session
        if (token && user) {
          login(token, user);
        }

        setSuccessMsg('Registration successful! Redirecting to email verification...');

        setTimeout(() => {
          if (verificationToken) {
            navigate(`/verify-email?token=${verificationToken}`);
          } else {
            navigate('/verify-email');
          }
        }, 1500);
      } else {
        setErrorMsg(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout 
      title="Company Onboarding & Registration" 
      subtitle="Register your organization and administrative account on DIWS"
      wide
    >
      {/* Steps Progression Bar */}
      <div className="diws-steps-bar">
        <div className={`diws-step-item ${step === 1 ? 'active' : 'completed'}`}>
          <div className="diws-step-number">{step > 1 ? '✓' : '1'}</div>
          <span>Company Profile</span>
        </div>
        <div style={{ flex: 1, height: 2, backgroundColor: 'var(--border-color)', margin: '0 1rem' }} />
        <div className={`diws-step-item ${step === 2 ? 'active' : ''}`}>
          <div className="diws-step-number">2</div>
          <span>Admin Account</span>
        </div>
      </div>

      {errorMsg && (
        <div className="diws-alert diws-alert-error" role="alert">
          <AlertCircle className="diws-alert-icon" size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="diws-alert diws-alert-success" role="alert">
          <CheckCircle2 className="diws-alert-icon" size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* STEP 1: COMPANY ONBOARDING */}
      {step === 1 && (
        <form onSubmit={handleNextStep}>
          <Input 
            label="Company Name" 
            id="companyName" 
            type="text" 
            placeholder="e.g. Acme Industrial Robotics Corp" 
            value={formData.companyName}
            onChange={handleInputChange}
            onBlur={handleCompanyNameBlur}
            icon={<Building size={18} />}
            required 
            hint="Your official registered business or organization name"
          />

          <div className="diws-grid diws-grid-2">
            <Input 
              label="Company Code (ID)" 
              id="companyCode" 
              type="text" 
              placeholder="e.g. ACME-01" 
              value={formData.companyCode}
              onChange={handleInputChange}
              icon={<Hash size={18} />}
              required 
              hint="Unique identifier code for workspace mapping (Uppercase)"
            />

            <div className="diws-form-group">
              <label htmlFor="industry" className="diws-label">
                Industry Sector <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div className="diws-input-wrapper">
                <span className="diws-input-icon">
                  <Briefcase size={18} />
                </span>
                <select
                  id="industry"
                  className="diws-input diws-input-with-icon"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Manufacturing">Manufacturing & Automation</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                  <option value="Aerospace & Defense">Aerospace & Defense</option>
                  <option value="Automotive">Automotive Industry</option>
                  <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                  <option value="Construction & Mining">Construction & Mining</option>
                  <option value="Chemicals & Materials">Chemicals & Materials</option>
                  <option value="Other">Other Industrial Sector</option>
                </select>
              </div>
            </div>
          </div>

          <div className="diws-mt-6 diws-flex diws-justify-between diws-items-center">
            <Link to="/login" className="diws-link diws-text-sm">
              Already have a registered company? Log in
            </Link>

            <Button type="submit" variant="copper" icon={<ArrowRight size={18} />}>
              Next: Account Setup
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: USER ACCOUNT SETUP */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="diws-grid diws-grid-2">
            <Input 
              label="First Name" 
              id="firstName" 
              type="text" 
              placeholder="Jane" 
              value={formData.firstName}
              onChange={handleInputChange}
              icon={<User size={18} />}
              required 
            />
            <Input 
              label="Last Name" 
              id="lastName" 
              type="text" 
              placeholder="Smith" 
              value={formData.lastName}
              onChange={handleInputChange}
              icon={<User size={18} />}
              required 
            />
          </div>

          <div className="diws-grid diws-grid-2">
            <Input 
              label="Work Email Address" 
              id="email" 
              type="email" 
              placeholder="jane.smith@company.com" 
              value={formData.email}
              onChange={handleInputChange}
              icon={<Mail size={18} />}
              required 
            />
            <Input 
              label="Phone Number (Optional)" 
              id="phone" 
              type="tel" 
              placeholder="+1 (555) 000-0000" 
              value={formData.phone}
              onChange={handleInputChange}
              icon={<Phone size={18} />}
            />
          </div>

          <div className="diws-grid diws-grid-2">
            <div>
              <Input 
                label="Password" 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleInputChange}
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
              {formData.password && (
                <div className="diws-password-meter">
                  <div className="diws-password-bar-bg">
                    <div 
                      className="diws-password-bar-fill"
                      style={{ width: strengthInfo.percent, backgroundColor: strengthInfo.color }}
                    />
                  </div>
                  <div className="diws-password-label">
                    <span>Strength: {strengthInfo.text}</span>
                    <span>Min 6 chars</span>
                  </div>
                </div>
              )}
            </div>

            <Input 
              label="Confirm Password" 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={formData.confirmPassword}
              onChange={handleInputChange}
              icon={<Lock size={18} />}
              required 
            />
          </div>

          <div className="diws-flex diws-items-center diws-gap-2 diws-text-sm" style={{ margin: '1.25rem 0', color: 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              id="agreeTerms" 
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              style={{ width: '18px', height: '18px', accentColor: 'var(--copper)', cursor: 'pointer' }}
              required 
            />
            <label htmlFor="agreeTerms" style={{ cursor: 'pointer' }}>
              I agree to the <Link to="/terms" className="diws-link">Terms of Service</Link> and <Link to="/privacy" className="diws-link">Privacy Policy</Link>
            </label>
          </div>

          <div className="diws-flex diws-justify-between diws-items-center diws-mt-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => { setErrorMsg(null); setStep(1); }}
              icon={<ArrowLeft size={18} />}
            >
              Back
            </Button>

            <Button type="submit" variant="primary" loading={loading} icon={<CheckCircle2 size={18} />}>
              Complete Onboarding
            </Button>
          </div>
        </form>
      )}

      <div className="diws-text-center diws-mt-6">
        <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="diws-link">Log in here</Link>
        </p>
      </div>
    </FormLayout>
  );
}
