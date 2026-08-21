import React, { useState, useEffect } from 'react';
import { User, Phone } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData | null;
  onSuccess?: (updatedUser: UserProfileData) => void;
}

export function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
      setRole(user.role);
      setDepartment(user.department || '');
    }
  }, [user, isOpen]);

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
    if (!firstName || !lastName) {
      setError('First and last name are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulating API call to PUT /api/users/:id
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (onSuccess && user) {
        onSuccess({
          ...user,
          firstName,
          lastName,
          phone,
          role,
          department
        });
      }
      onClose();
    } catch (err) {
      setError('Failed to update user profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" maxWidth="md">
      <form onSubmit={handleSubmit} className="diws-grid gap-4">
        {error && (
          <div className="diws-alert diws-alert-error">
            {error}
          </div>
        )}
        
        <div className="diws-grid-2">
          <Input
            label="First Name"
            id="edit-firstname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            icon={<User size={18} />}
            required
          />
          <Input
            label="Last Name"
            id="edit-lastname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            icon={<User size={18} />}
            required
          />
        </div>

        <Input
          label="Email Address"
          id="edit-email"
          value={user.email}
          disabled
          hint="Email addresses cannot be changed after invitation."
        />

        <Input
          label="Phone Number"
          id="edit-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<Phone size={18} />}
        />
        
        <Select
          label="Role"
          id="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={roles}
          required
        />

        <Select
          label="Department"
          id="edit-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          options={departments}
        />
        
        <div className="diws-flex diws-justify-between diws-mt-6" style={{ gap: '1rem' }}>
          <Button type="button" variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditUserModal;
