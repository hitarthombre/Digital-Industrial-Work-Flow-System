import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Power, Trash2, Mail, Phone, Calendar, Shield, MapPin, Monitor } from 'lucide-react';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import EditUserModal from '../../components/users/EditUserModal';
import type { UserProfileData } from '../../components/users/EditUserModal';

// Mock Data
const MOCK_USER = {
  id: 'USR-1042',
  firstName: 'Diana',
  lastName: 'Prince',
  email: 'diana.prince@example.com',
  phone: '+1 (555) 123-4567',
  role: 'Factory Manager',
  department: 'Management',
  status: 'Active',
  createdAt: '2025-11-15T10:00:00Z',
  lastLogin: '2026-08-12T08:30:00Z',
};

const MOCK_ACTIVITY = [
  { id: 'ACT-1', type: 'login', action: 'User logged in', timestamp: '2026-08-12T08:30:00Z', ip: '192.168.1.45', browser: 'Chrome on Windows 11' },
  { id: 'ACT-2', type: 'company:update', action: 'Updated company settings', timestamp: '2026-08-10T14:20:00Z', ip: '192.168.1.45', browser: 'Chrome on Windows 11' },
  { id: 'ACT-3', type: 'login', action: 'User logged in', timestamp: '2026-08-09T09:15:00Z', ip: '192.168.1.112', browser: 'Safari on macOS' },
  { id: 'ACT-4', type: 'user:accept_invite', action: 'Accepted invitation & set password', timestamp: '2025-11-16T11:45:00Z', ip: '10.0.0.5', browser: 'Firefox on Linux' },
  { id: 'ACT-5', type: 'user:invite', action: 'Invitation sent by Admin', timestamp: '2025-11-15T10:00:00Z', ip: '10.0.0.1', browser: 'System' },
];

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');
  
  // Modals & State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API Fetch
    setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleUpdateUser = (updated: UserProfileData) => {
    setUser(updated);
  };

  const handleToggleStatus = async () => {
    setIsSubmitting(true);
    // Simulate PATCH /api/users/:id/status
    await new Promise(res => setTimeout(res, 800));
    setUser(prev => prev ? { ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' } : null);
    setIsSubmitting(false);
    setIsStatusModalOpen(false);
  };

  const handleDeleteUser = async () => {
    setIsSubmitting(true);
    // Simulate DELETE /api/users/:id
    await new Promise(res => setTimeout(res, 800));
    setIsSubmitting(false);
    setIsDeleteModalOpen(false);
    navigate('/app/users');
  };

  if (loading || !user) {
    return (
      <div className="diws-content-wrapper diws-flex diws-items-center diws-justify-center" style={{ minHeight: '60vh' }}>
        <div className="diws-spinner" style={{ borderColor: 'var(--copper)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <div className="diws-content-wrapper diws-grid gap-6" style={{ padding: '2rem 0' }}>
      
      {/* Top Nav */}
      <div className="diws-flex diws-items-center" style={{ gap: '0.5rem' }}>
        <button 
          onClick={() => navigate('/app/users')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Back to Users
        </button>
      </div>

      {/* Header Banner */}
      <div className="diws-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2rem' }}>
        <div className="diws-flex diws-items-center" style={{ gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest), var(--forest-dark))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600 }}>
            {initials}
          </div>
          <div className="diws-flex-col gap-2" style={{ gap: '0.5rem' }}>
            <div className="diws-flex diws-items-center" style={{ gap: '1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--forest-dark)' }}>
                {user.firstName} {user.lastName}
              </h1>
              <Badge variant={user.status === 'Active' ? 'success' : 'error'}>{user.status}</Badge>
            </div>
            
            <div className="diws-flex diws-items-center" style={{ gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div className="diws-flex diws-items-center" style={{ gap: '0.4rem' }}>
                <Mail size={14} /> {user.email}
              </div>
              <div className="diws-flex diws-items-center" style={{ gap: '0.4rem' }}>
                <Shield size={14} /> {user.role}
              </div>
              <div className="diws-flex diws-items-center" style={{ gap: '0.4rem' }}>
                <Badge variant="neutral">{user.department}</Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="diws-flex diws-items-center gap-3" style={{ gap: '0.75rem' }}>
          <Button variant="outline" icon={<Edit size={16} />} onClick={() => setIsEditModalOpen(true)}>
            Edit
          </Button>
          <Button variant="secondary" icon={<Power size={16} />} onClick={() => setIsStatusModalOpen(true)}>
            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setIsDeleteModalOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '2rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'profile' ? 'var(--forest-dark)' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--copper)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'activity' ? 'var(--forest-dark)' : 'var(--text-muted)',
            borderBottom: activeTab === 'activity' ? '2px solid var(--copper)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Activity History
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1rem 0' }}>
        {activeTab === 'profile' ? (
          <div className="diws-grid-2">
            <div className="diws-card diws-flex-col" style={{ gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--forest-dark)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Personal Information
              </h3>
              <div className="diws-grid" style={{ gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>PHONE NUMBER</div>
                  <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                    <Phone size={16} color="var(--copper)" /> {user.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>EMAIL ADDRESS</div>
                  <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                    <Mail size={16} color="var(--copper)" /> {user.email}
                  </div>
                </div>
                <div className="diws-grid-2">
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>ACCOUNT CREATED</div>
                    <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                      <Calendar size={16} color="var(--copper)" /> {new Date(user.createdAt as string).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>LAST LOGIN</div>
                    <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                      <Calendar size={16} color="var(--copper)" /> {new Date(user.lastLogin as string).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="diws-card diws-flex-col" style={{ gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--forest-dark)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                System Permissions
              </h3>
              <div className="diws-grid" style={{ gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>ASSIGNED ROLE</div>
                  <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                    <Badge variant={user.role === 'Company Admin' ? 'copper' : 'primary'}>{user.role}</Badge>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>DEPARTMENT</div>
                  <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', color: 'var(--text-main)' }}>
                    {user.department || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>ACCESS MODULES</div>
                  <div className="diws-flex diws-items-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Dashboard', 'Production', 'Reports'].map(mod => (
                      <Badge key={mod} variant="neutral">{mod}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="diws-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--forest-dark)', margin: 0, marginBottom: '2rem' }}>
              Audit & Activity Log
            </h3>
            <div style={{ position: 'relative', borderLeft: '2px solid var(--border-color)', paddingLeft: '2rem', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {MOCK_ACTIVITY.map((act, index) => (
                <div key={act.id} style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', left: '-2.55rem', top: '0', width: '1rem', height: '1rem', borderRadius: '50%', 
                    background: index === 0 ? 'var(--copper)' : 'var(--cream)', 
                    border: index === 0 ? '4px solid rgba(184, 115, 51, 0.2)' : '2px solid var(--border-color)' 
                  }}></div>
                  <div className="diws-flex-col" style={{ gap: '0.5rem' }}>
                    <div className="diws-flex diws-items-center diws-justify-between">
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{act.action}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="diws-flex diws-items-center" style={{ gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div className="diws-flex diws-items-center" style={{ gap: '0.3rem' }}><MapPin size={12} /> {act.ip}</div>
                      <div className="diws-flex diws-items-center" style={{ gap: '0.3rem' }}><Monitor size={12} /> {act.browser}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EditUserModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user as any} 
        onSuccess={handleUpdateUser}
      />

      {/* Status Toggle Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Confirm Status Change">
        <div className="diws-flex-col diws-items-center diws-text-center gap-4">
          <div style={{ color: 'var(--warning-color)', marginBottom: '1rem' }}>
            <Shield size={48} />
          </div>
          <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            Are you sure you want to <strong>{user.status === 'Active' ? 'deactivate' : 'activate'}</strong> {user.firstName} {user.lastName}?
            {user.status === 'Active' && " They will immediately lose access to the system."}
          </p>
          <div className="diws-flex diws-justify-center gap-4" style={{ width: '100%', gap: '1rem' }}>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} fullWidth>Cancel</Button>
            <Button variant="copper" onClick={handleToggleStatus} loading={isSubmitting} fullWidth>
              Yes, {user.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User">
        <div className="diws-flex-col diws-items-center diws-text-center gap-4">
          <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>
            <Trash2 size={48} />
          </div>
          <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            Are you sure you want to completely remove <strong>{user.firstName} {user.lastName}</strong> from this organization? This action cannot be undone.
          </p>
          <div className="diws-flex diws-justify-center gap-4" style={{ width: '100%', gap: '1rem' }}>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} fullWidth>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} loading={isSubmitting} fullWidth>
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
