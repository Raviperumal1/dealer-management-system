import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { userService } from '../../services/userService';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import { formatPhone } from '../../utils/formatters';
import { ShieldAlert, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().optional().or(z.literal('')),
  role: z.string().min(1, 'Select at least one role'),
});

export function UserListPage() {
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState('');
  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userRes, roleRes] = await Promise.all([
        userService.getAllUsers({ search: searchTerm || undefined, page, size, sortBy, sortDirection }),
        userService.getAllRoles().catch(() => []),
      ]);
      setUsers(userRes.content || []);
      setRoles(roleRes || []);
      setTotalPages(userRes.totalPages || 1);
      setTotalElements(userRes.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load system users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size, sortBy, sortDirection, searchTerm]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    reset({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: roles[0]?.name || 'STAFF',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    reset({
      username: u.username || '',
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: (u.roles && u.roles[0]) || roles[0]?.name || 'STAFF',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const onSubmitUser = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingUser) {
        const updatePayload = {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || '',
          active: editingUser.active,
          roles: [data.role],
        };
        await userService.updateUser(editingUser.id, updatePayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'User Updated',
            message: `${data.fullName} details updated successfully.`,
          })
        );
      } else {
        if (!data.password || data.password.length < 6) {
          setModalError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        const createPayload = {
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || '',
          password: data.password,
          roles: [data.role],
        };
        await userService.createUser(createPayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'User Created',
            message: `${data.fullName} user account registered.`,
          })
        );
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to save user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      if (u.active) {
        await userService.deactivateUser(u.id);
        dispatch(addToast({ type: 'warning', message: `User @${u.username} deactivated.` }));
      } else {
        await userService.activateUser(u.id);
        dispatch(addToast({ type: 'success', message: `User @${u.username} activated.` }));
      }
      fetchUsers();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Status update failed' }));
    }
  };

  const columns = [
    {
      header: 'User Account',
      field: 'username',
      sortable: true,
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: '36px', height: '36px' }}
          >
            {row.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="fw-bold text-dark">{row.fullName}</div>
            <span className="text-muted small">@{row.username}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      field: 'email',
      render: (row) => row.email,
    },
    {
      header: 'Phone',
      field: 'phone',
      render: (row) => <span className="font-monospace small">{formatPhone(row.phone)}</span>,
    },
    {
      header: 'Roles',
      field: 'roles',
      render: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.roles?.map((r) => (
            <span key={r} className="badge bg-primary-subtle text-primary border">
              {r.replace('ROLE_', '')}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      field: 'active',
      render: (row) => (
        <button
          type="button"
          className={`badge border-0 ${row.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
          onClick={() => handleToggleActive(row)}
          title="Click to toggle status"
          style={{ cursor: 'pointer' }}
        >
          {row.active ? 'ACTIVE' : 'INACTIVE'}
        </button>
      ),
    },
    {
      header: 'Actions',
      field: 'actions',
      className: 'text-end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary p-1"
            title="Edit User"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Account Management"
        subtitle="Manage dealership staff logins, role assignments, and account authorization"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin' },
          { label: 'Users' },
        ]}
      >
        <button
          type="button"
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> New User
        </button>
      </PageHeader>

      {/* User Management Metric Ribbon */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Total Staff Accounts</div>
              <div className="kpi-value fs-5 mt-0.5">{totalElements}</div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Registered DMS profiles</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-primary" style={{ width: '36px', height: '36px' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Active Accounts</div>
              <div className="kpi-value fs-5 mt-0.5 text-success">
                {users.filter((u) => u.active).length}
              </div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Authorized to sign in</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-success" style={{ width: '36px', height: '36px' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Configured Roles</div>
              <div className="kpi-value fs-5 mt-0.5 text-primary">{roles.length || 2}</div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>ADMIN & STAFF tiers</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-info" style={{ width: '36px', height: '36px' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
        </div>
      </div>

      <FilterBar onReset={() => setSearchTerm('')} hasActiveFilters={Boolean(searchTerm)}>
        <SearchInput
          placeholder="Search by username, name, email..."
          value={searchTerm}
          onChange={(val) => setSearchTerm(val)}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        onRetry={fetchUsers}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages,
          totalElements,
          pageSize: size,
          onPageChange: handlePageChange,
          onSizeChange: handleSizeChange,
        }}
        emptyTitle="No users found"
        emptyDescription="Create user accounts to grant dealership staff access to the DMS."
      />

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">
                  {editingUser ? 'Edit User Account' : 'Register New Dealership User'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmitUser)}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="userUnameInput">
                        Username *
                      </label>
                      <input
                        id="userUnameInput"
                        type="text"
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        placeholder="e.g. jdoe"
                        {...register('username')}
                        disabled={Boolean(editingUser)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="userFullNameInput">
                        Full Name *
                      </label>
                      <input
                        id="userFullNameInput"
                        type="text"
                        className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                        placeholder="e.g. Rajesh Sharma"
                        {...register('fullName')}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="userEmailInput">
                        Email Address *
                      </label>
                      <input
                        id="userEmailInput"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="user@dealership.com"
                        {...register('email')}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="userPhoneInput">
                        Mobile Number
                      </label>
                      <input
                        id="userPhoneInput"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="10 digits"
                        {...register('phone')}
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label" htmlFor="userPwdInput">
                        Initial Password *
                      </label>
                      <input
                        id="userPwdInput"
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="At least 8 characters"
                        {...register('password')}
                      />
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label">Assign Role *</label>
                    <select
                      className="form-select"
                      {...register('role')}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name.replace('ROLE_', '')} — {r.description || 'System Role'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserListPage;
