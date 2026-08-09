import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import '../custom-ui.css';

export default function ForgotPassword() {
  return (
    <FormLayout title="Reset Password" subtitle="Enter your email to receive reset instructions">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input label="Email Address" id="email" type="email" placeholder="admin@example.com" required />
        <Button type="submit" fullWidth>Send Reset Link</Button>
      </form>
      <div className="diws-text-center diws-mt-6">
        <a href="/login" className="diws-link diws-text-sm">Back to Login</a>
      </div>
    </FormLayout>
  );
}
