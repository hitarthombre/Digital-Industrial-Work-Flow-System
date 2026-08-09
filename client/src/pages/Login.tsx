import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import '../custom-ui.css';

export default function Login() {
  return (
    <FormLayout title="Welcome Back" subtitle="Log in to your DIWS portal account">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input label="Email Address" id="email" type="email" placeholder="admin@example.com" required />
        <Input label="Password" id="password" type="password" placeholder="••••••••" required />
        
        <div className="diws-flex diws-justify-between diws-items-center" style={{ marginBottom: '1.25rem' }}>
          <label className="diws-flex diws-items-center diws-gap-2 diws-text-sm" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" className="diws-input" style={{ width: 'auto', padding: 0 }} />
            Remember me
          </label>
          <a href="/forgot-password" className="diws-link diws-text-sm">Forgot password?</a>
        </div>

        <Button type="submit" fullWidth>Log In</Button>
      </form>
      <div className="diws-text-center diws-mt-6">
        <p className="diws-text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account? <a href="/register" className="diws-link">Register here</a>
        </p>
      </div>
    </FormLayout>
  );
}
