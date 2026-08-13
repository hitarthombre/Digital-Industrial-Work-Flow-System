import React, { useState } from 'react';
import { Mail, CheckCircle2, Copy } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successLink, setSuccessLink] = useState('');

  const roles = [
    { value: 'Company Admin', label: 'Company Admin' },
    { value: 'Factory Manager', label: 'Factory Manager' },
    { value: 'Warehouse Supervisor', label: 'Warehouse Supervisor' },
    { value: 'Quality Engineer', label: 'Quality Engineer' },
    { value: 'Operator', label: 'Operator' },
    { value: 'Employee', label: 'Employee' },
  ];

  const departments = [
    { value: '', label: 'None (Optional)' },
    { value: 'Production', label: 'Production' },
    { value: 'Quality Control', label: 'Quality Control' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Management', label: 'Management' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulating API call to POST /api/users/invite
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockToken = Math.random().toString(36).substring(2, 15);
      const inviteUrl = `${window.location.origin}/accept-invite?token=${mockToken}`;
      
      setSuccessLink(inviteUrl);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(successLink);
  };

  const handleResetAndClose = () => {
    setEmail('');
    setRole('Employee');
    setDepartment('');
    setError('');
    setSuccessLink('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} title="Invite New User" maxWidth="md">
      {!successLink ? (
        <form onSubmit={handleSubmit} className="diws-grid gap-4">
          {error && (
            <div className="diws-alert diws-alert-error">
              {error}
            </div>
          )}
          
          <Input
            label="Email Address"
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            icon={<Mail size={18} />}
            required
          />
          
          <Select
            label="Role"
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roles}
            required
          />

          <Select
            label="Department"
            id="invite-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={departments}
          />
          
          <div className="diws-flex diws-justify-between diws-mt-6" style={{ gap: '1rem' }}>
            <Button type="button" variant="outline" onClick={handleResetAndClose} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="copper" loading={isSubmitting} fullWidth>
              Send Invitation
            </Button>
          </div>
        </form>
      ) : (
        <div className="diws-flex-col diws-items-center diws-text-center" style={{ padding: '2rem 1rem' }}>
          <div style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>
            <CheckCircle2 size={64} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--forest-dark)' }}>
            Invitation Sent!
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            We've sent an invitation email to <strong>{email}</strong>.
          </p>
          
          <div className="diws-alert diws-alert-success diws-flex-col" style={{ width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Or share this link directly:</span>
            <div className="diws-flex diws-items-center" style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', width: '100%', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
              <input 
                type="text" 
                readOnly 
                value={successLink} 
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', color: 'var(--text-muted)' }} 
              />
              <Button type="button" variant="secondary" onClick={handleCopyLink} icon={<Copy size={16} />} style={{ padding: '0.25rem 0.5rem' }}>
                Copy
              </Button>
            </div>
          </div>
          
          <Button type="button" variant="primary" onClick={handleResetAndClose} className="diws-mt-6">
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default InviteUserModal;
