import React from 'react';
import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import '../custom-ui.css';

export default function Register() {
  return (
    <FormLayout title="Create an Account" subtitle="Join the Digital Industrial Work Flow System">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="diws-grid diws-grid-2" style={{ gap: '1rem' }}>
          <Input label="First Name" id="firstName" type="text" placeholder="John" required />
          <Input label="Last Name" id="lastName" type="text" placeholder="Doe" required />
        </div>
        <Input label="Email Address" id="email" type="email" placeholder="john@example.com" required />
        <Input label="Password" id="password" type="password" placeholder="••••••••" required />
        <Input label="Confirm Password" id="confirmPassword" type="password" placeholder="••••••••" required />
        
        <div className="diws-flex diws-items-center diws-gap-2 diws-text-sm" style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
          <input type="checkbox" id="terms" className="diws-input" style={{ width: 'auto', padding: 0 }} required />
          <label htmlFor="terms" style={{ cursor: 'pointer' }}>
            I agree to the <a href="/terms" className="diws-link">Terms</a> and <a href="/privacy" className="diws-link">Privacy Policy</a>
          </label>
        </div>

        <Button type="submit" fullWidth>Create Account</Button>
      </form>
      <div className="diws-text-center diws-mt-6">
        <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <a href="/login" className="diws-link">Log in</a>
        </p>
      </div>
    </FormLayout>
  );
}
