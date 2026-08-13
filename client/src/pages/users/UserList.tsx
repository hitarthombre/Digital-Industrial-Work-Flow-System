import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, ShieldAlert } from 'lucide-react';
import { Table } from '../../components/Table';
import type { Column } from '../../components/Table';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import InviteUserModal from '../../components/users/InviteUserModal';

// Mock Data
const MOCK_USERS = Array.from({ length: 45 }).map((_, i) => ({
  id: `USR-${1000 + i}`,
  firstName: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'][i % 6],
  lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][i % 6] + (i % 3 === 0 ? 'son' : ''),
  email: `user${1000 + i}@example.com`,
  role: ['Company Admin', 'Factory Manager', 'Warehouse Supervisor', 'Quality Engineer', 'Operator', 'Employee'][i % 6],
  department: ['Management', 'Production', 'Warehouse', 'Quality Control', 'Production', 'Maintenance'][i % 6],
  status: i % 7 === 0 ? 'Inactive' : 'Active',
  lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  avatarUrl: `https://i.pravatar.cc/150?u=${i}`,
}));

export default function UserList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Filter and Search Logic
  const filteredData = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      const matchesStatus = statusFilter ? user.status === statusFilter : true;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchTerm, roleFilter, statusFilter]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Table Columns Definition
  const columns: Column<typeof MOCK_USERS[0]>[] = [
    {
      key: 'name',
      header: 'Name & Avatar',
      render: (user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={user.avatarUrl} 
            alt={user.firstName} 
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.id}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={user.role === 'Company Admin' ? 'copper' : 'neutral'}>
          {user.role}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.status === 'Active' ? 'success' : 'error'}>
          {user.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user) => new Date(user.lastLogin).toLocaleDateString(),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (user) => (
        <button 
          onClick={() => navigate(`/app/users/${user.id}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <MoreVertical size={18} />
        </button>
      )
    },
  ];

  return (
    <div className="diws-content-wrapper diws-grid gap-6" style={{ padding: '2rem 0' }}>
      
      {/* Header Actions */}
      <div className="diws-flex diws-items-center diws-justify-between">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--forest-dark)', marginBottom: '0.25rem' }}>
            Company Users
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage access, roles, and profiles for your organization.</p>
        </div>
        <div className="diws-flex gap-3" style={{ gap: '0.75rem' }}>
          <Button variant="outline" icon={<ShieldAlert size={16} />}>
            Manage Roles
          </Button>
          <Button variant="copper" icon={<Plus size={16} />} onClick={() => setIsInviteModalOpen(true)}>
            Invite User
          </Button>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="diws-card diws-flex diws-items-center diws-justify-between" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ width: '320px' }}>
          <Input 
            label="" 
            id="search-users" 
            placeholder="Search users by name or email..." 
            icon={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div className="diws-flex diws-items-center" style={{ gap: '1rem' }}>
          <div className="diws-flex diws-items-center" style={{ gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filters:</span>
          </div>
          <select 
            className="diws-input" 
            style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', width: 'auto' }}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="Company Admin">Company Admin</option>
            <option value="Factory Manager">Factory Manager</option>
            <option value="Warehouse Supervisor">Warehouse Supervisor</option>
            <option value="Quality Engineer">Quality Engineer</option>
            <option value="Operator">Operator</option>
            <option value="Employee">Employee</option>
          </select>

          <select 
            className="diws-input" 
            style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', width: 'auto' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="diws-card" style={{ padding: '0' }}>
        <Table 
          columns={columns} 
          data={paginatedData} 
          pagination={{
            currentPage: page,
            totalPages,
            totalItems: filteredData.length,
            pageSize,
            onPageChange: (newPage) => setPage(newPage)
          }}
          rowKey={(user) => user.id}
          onSort={() => {}} // Dummy sort for visual purposes
        />
      </div>

      <InviteUserModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={() => {}}
      />
    </div>
  );
}
