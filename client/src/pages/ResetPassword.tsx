import { FormLayout } from '../components/FormLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import '../custom-ui.css';

export default function ResetPassword() {
  return (
    <FormLayout title="Create New Password" subtitle="Enter your new password below">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input label="New Password" id="newPassword" type="password" placeholder="••••••••" required />
        <Input label="Confirm New Password" id="confirmPassword" type="password" placeholder="••••••••" required />
        <Button type="submit" fullWidth>Reset Password</Button>
      </form>
    </FormLayout>
  );
}
