import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addToast } from '../ui/uiSlice';
import { userService } from '../../services/userService';
import { fetchCurrentUser } from '../auth/authSlice';
import PageHeader from '../../components/common/PageHeader';
import { formatPhone } from '../../utils/formatters';
import {
  User,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  Edit2,
  CheckCircle2,
  Lock,
  Building2,
  Laptop,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
});

export function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'permissions' | 'security'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const isAdmin = user?.roles?.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const handleOpenEdit = () => {
    reset({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const onSubmitProfile = async (data) => {
    if (!user?.id) {
      setModalError('User ID not available for update');
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        active: true,
        roles: user.roles || ['ADMIN'],
      };
      await userService.updateUser(user.id, payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your personal account details have been successfully saved.',
        })
      );
      dispatch(fetchCurrentUser());
      setIsEditModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Failed to update profile details');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div>
      <PageHeader
        title="My Profile & Security"
        subtitle="Manage your personal account credentials, dealership roles, and system authorizations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Security' },
          { label: 'My Profile' },
        ]}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-xs fw-medium"
            onClick={() => navigate('/change-password')}
          >
            <KeyRound size={15} /> Change Password
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-xs fw-medium"
            onClick={handleOpenEdit}
          >
            <Edit2 size={15} /> Edit Profile
          </button>
        </div>
      </PageHeader>

      {/* Modern Executive Hero Profile Container */}
      <div
        className="card border mb-3 overflow-hidden rounded-3"
        style={{
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          color: '#ffffff',
        }}
      >
        <div className="p-3 p-md-4">
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
            {/* Left: Avatar + User Details */}
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold position-relative flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  fontSize: '1.6rem',
                  backgroundColor: '#1e3a8a',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
                <span
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white"
                  style={{ width: '18px', height: '18px' }}
                  title="Active Session"
                />
              </div>

              <div>
                <div className="d-flex align-items-center gap-2.5 flex-wrap mb-2">
                  <h2 className="h3 fw-bold text-white mb-0">{user?.fullName || 'System Administrator'}</h2>
                  <span
                    className="badge font-monospace px-3 py-1 rounded-pill"
                    style={{
                      background: 'rgba(59, 130, 246, 0.25)',
                      color: '#93C5FD',
                      border: '1px solid rgba(147, 197, 253, 0.4)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isAdmin ? 'ADMINISTRATOR' : 'STAFF SPECIALIST'}
                  </span>
                  <span
                    className="badge px-3 py-1 rounded-pill fw-semibold"
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#6EE7B7',
                      border: '1px solid rgba(110, 231, 183, 0.4)',
                      fontSize: '0.75rem',
                    }}
                  >
                    ● ACTIVE
                  </span>
                </div>

                <div
                  className="d-flex align-items-center gap-3 small flex-wrap"
                  style={{ color: 'rgba(255, 255, 255, 0.75)' }}
                >
                  <span className="font-monospace text-info fw-semibold">@{user?.username || 'admin'}</span>
                  <span>•</span>
                  <span>{user?.email || 'admin@dealership.com'}</span>
                  {user?.phone && (
                    <>
                      <span>•</span>
                      <span className="font-monospace">{formatPhone(user.phone)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action & Role Identifiers */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span
                className="badge font-monospace px-3.5 py-2 rounded-pill"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.8rem',
                }}
              >
                USER ID: #{user?.id || '1'}
              </span>
              <span
                className="badge px-3.5 py-2 rounded-pill fw-semibold"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.8rem',
                }}
              >
                ROLE: {Array.isArray(user?.roles) ? user.roles[0]?.replace('ROLE_', '') : 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-Impact Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                Security Tier
              </span>
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: '40px', height: '40px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="h4 fw-bold text-dark mb-1">
              {isAdmin ? 'Superuser Tier 1' : 'Staff Tier 2'}
            </div>
            <div className="text-muted small">
              Full administrative rights
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                Entitled Modules
              </span>
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: '40px', height: '40px', backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="h4 fw-bold mb-1" style={{ color: '#059669' }}>
              {isAdmin ? '10 / 10 Modules' : `${user?.permissions?.filter((p) => p.canView)?.length || 0} Modules`}
            </div>
            <div className="text-muted small">
              Complete workspace access
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                Session Status
              </span>
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: '40px', height: '40px', backgroundColor: '#F0FDF4', color: '#0284C7' }}
              >
                <Lock size={20} />
              </div>
            </div>
            <div className="h4 fw-bold text-dark mb-1">
              JWT Authenticated
            </div>
            <div className="text-muted small">
              Expires in 24 hours
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                Dealership Node
              </span>
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: '40px', height: '40px', backgroundColor: '#FFFBEB', color: '#D97706' }}
              >
                <Building2 size={20} />
              </div>
            </div>
            <div className="h4 fw-bold text-dark mb-1">
              Main Showroom HQ
            </div>
            <div className="text-muted small">
              Primary Operations Branch
            </div>
          </div>
        </div>
      </div>

      {/* DEALEROS Segmented Tabs (2 Clean Tabs) */}
      <div className="segmented-control mb-4">
        <button
          type="button"
          className={`segmented-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={15} /> Account Overview
        </button>
        <button
          type="button"
          className={`segmented-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={15} /> Security & Session Credentials
        </button>
      </div>

      {/* Tab 1: Account Overview */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="app-card h-100">
              <div className="app-card-header">
                <h3 className="app-card-title">Personal Credentials & Contact</h3>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm py-1 px-2.5 d-flex align-items-center gap-1 small"
                  onClick={handleOpenEdit}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
              <div className="app-card-body">
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">Full Legal Name</label>
                    <div className="fw-semibold text-dark fs-6">{user?.fullName || 'System Administrator'}</div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">System Username</label>
                    <div className="font-monospace fw-semibold text-dark fs-6">@{user?.username || 'admin'}</div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">Registered Email</label>
                    <div className="d-flex align-items-center gap-1.5 text-dark fw-medium">
                      <Mail size={15} className="text-primary flex-shrink-0" />
                      <span className="text-truncate">{user?.email || 'admin@dealership.com'}</span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">Mobile Telephone</label>
                    <div className="d-flex align-items-center gap-1.5 text-dark fw-medium font-monospace">
                      <Phone size={15} className="text-success flex-shrink-0" />
                      <span>{user?.phone ? formatPhone(user.phone) : '+91 98765 43210'}</span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">Account Role Designation</label>
                    <div className="d-flex align-items-center gap-1.5">
                      <ShieldCheck size={16} className="text-primary" />
                      <span className="fw-bold text-dark">
                        {Array.isArray(user?.roles) ? user.roles[0]?.replace('ROLE_', '') : 'ADMIN'}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="text-muted small d-block mb-1">Account Authorization Status</label>
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Active & In Good Standing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="app-card h-100">
              <div className="app-card-header">
                <h3 className="app-card-title">Dealership System Node</h3>
                <span className="badge bg-light text-dark border">DEALEROS DMS</span>
              </div>
              <div className="app-card-body d-flex flex-column justify-content-between">
                <div>
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Building2 size={18} className="text-primary" />
                      <span className="fw-bold text-dark">Enterprise Dealership Network</span>
                    </div>
                    <p className="text-muted small mb-0">
                      You are connected to the authoritative Dealership Management System database node. All operations adhere to standard accounting and stock movement principles.
                    </p>
                  </div>

                  <ul className="list-group list-group-flush small">
                    <li className="list-group-item px-0 d-flex justify-content-between text-muted">
                      <span>Database Ledger</span>
                      <span className="fw-semibold text-dark">dealership_db (MySQL 8.0)</span>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between text-muted">
                      <span>API Gateway</span>
                      <span className="font-monospace fw-semibold text-dark">/api/v1.0</span>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between text-muted">
                      <span>Role Bypass</span>
                      <span className="badge bg-primary-subtle text-primary border">SUPERUSER (Admin)</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-top mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
                    onClick={() => navigate('/change-password')}
                  >
                    <KeyRound size={15} /> Update Account Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Session Credentials */}
      {activeTab === 'security' && (
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="app-card h-100">
              <div className="app-card-header">
                <h3 className="app-card-title">Authentication & Credentials</h3>
                <ShieldCheck size={18} className="text-success" />
              </div>
              <div className="app-card-body">
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border mb-3">
                  <div>
                    <div className="fw-bold text-dark small">Password Authentication</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Protected with salted BCrypt one-way hashing
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate('/change-password')}
                  >
                    Change Password
                  </button>
                </div>

                <div className="small">
                  <div className="fw-semibold text-dark mb-2">Password Policy Requirements:</div>
                  <ul className="list-unstyled d-flex flex-column gap-2 text-muted mb-0">
                    <li className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={15} className="text-success" />
                      <span>Minimum 8 characters length</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={15} className="text-success" />
                      <span>At least one uppercase alphabetical character [A-Z]</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={15} className="text-success" />
                      <span>At least one numerical digit [0-9]</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={15} className="text-success" />
                      <span>Protected against dictionary & brute-force attempts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="app-card h-100">
              <div className="app-card-header">
                <h3 className="app-card-title">Active Session & Encryption</h3>
                <Laptop size={18} className="text-primary" />
              </div>
              <div className="app-card-body">
                <ul className="list-group list-group-flush small mb-3">
                  <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Security Protocol</span>
                    <span className="fw-semibold text-dark">JSON Web Token (JJWT 0.12.6)</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Access Token Lifespan</span>
                    <span className="fw-semibold text-dark">24 Hours (86,400,000 ms)</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Refresh Token Rotation</span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      Enabled
                    </span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Rate Limiting Protection</span>
                    <span className="badge bg-info-subtle text-info border border-info-subtle">
                      100 req/min
                    </span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Current Client Application</span>
                    <span className="fw-semibold text-dark">DEALEROS DMS Web Client</span>
                  </li>
                </ul>

                <div className="p-2.5 rounded-3 bg-light border text-muted" style={{ fontSize: '0.78rem' }}>
                  If you suspect unauthorized activity, immediately change your password. This will invalidate all active refresh tokens.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Edit Profile Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsEditModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="editFullNameInput">
                      Full Legal Name *
                    </label>
                    <input
                      id="editFullNameInput"
                      type="text"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="e.g. System Administrator"
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="editEmailInput">
                      Email Address *
                    </label>
                    <input
                      id="editEmailInput"
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="admin@dealership.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="editPhoneInput">
                      Mobile Telephone Number
                    </label>
                    <input
                      id="editPhoneInput"
                      type="text"
                      className="form-control font-monospace"
                      placeholder="10-digit number"
                      {...register('phone')}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
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

export default ProfilePage;
