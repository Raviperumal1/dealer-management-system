import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToast } from '../ui/uiSlice';
import authService from '../../services/authService';
import PageHeader from '../../components/common/PageHeader';
import {
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Check,
  ShieldAlert,
  Smartphone,
  History,
  Info,
} from 'lucide-react';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export function ChangePasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const newPasswordValue = watch('newPassword') || '';

  // Password Strength Evaluation
  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasNumber = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPasswordValue);

  const criteriaCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthPercentage = (criteriaCount / 4) * 100;
  const strengthLabel =
    criteriaCount <= 1 ? 'Weak' : criteriaCount <= 3 ? 'Medium' : 'Strong & Secure';
  const strengthColor =
    criteriaCount <= 1 ? 'bg-danger' : criteriaCount <= 3 ? 'bg-warning' : 'bg-success';

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Password Updated',
          message: 'Your dealership account password has been updated securely.',
        })
      );
      reset();
      navigate('/profile');
    } catch (err) {
      setServerError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-5">
      {/* Header Bar */}
      <PageHeader
        title="Security & Password Settings"
        subtitle="Manage dealership authentication credentials, session security, and account access policies"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile', href: '/profile' },
          { label: 'Security & Password' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 rounded-3 shadow-xs"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={15} /> Back to Profile
        </button>
      </PageHeader>

      <div className="row g-4">
        {/* LEFT COLUMN: Main Form Card (7 Cols) */}
        <div className="col-12 col-lg-7">
          <div className="bg-white border rounded-4 shadow-sm overflow-hidden h-100 d-flex flex-column justify-content-between" style={{ borderColor: '#e2e8f0' }}>
            <div>
              {/* Card Header Strip */}
              <div className="p-4 border-bottom bg-light bg-opacity-50 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center shadow-xs"
                    style={{ width: '42px', height: '42px' }}
                  >
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="fs-6 fw-bold mb-0 text-dark">Security Credential Update</h3>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                      Changes take effect immediately across all active browser sessions
                    </p>
                  </div>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill small">
                  SSL Encrypted
                </span>
              </div>

              <div className="p-4 p-md-4">
                {serverError && (
                  <div className="alert alert-danger py-2.5 px-3 small d-flex align-items-center gap-2 mb-4 rounded-3 border-danger-subtle">
                    <AlertCircle size={17} className="text-danger flex-shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* Current Password */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small mb-1.5" htmlFor="currentPassword">
                      Current Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <Lock
                        size={17}
                        className="position-absolute text-muted"
                        style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        id="currentPassword"
                        type={showCurrent ? 'text' : 'password'}
                        className={`form-control rounded-3 py-2.5 ${errors.currentPassword ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: '44px', paddingRight: '44px', minHeight: '46px' }}
                        placeholder="Enter your current password"
                        {...register('currentPassword')}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute text-muted p-0"
                        style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => setShowCurrent(!showCurrent)}
                        tabIndex="-1"
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                      >
                        {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <div className="text-danger small mt-1.5" style={{ fontSize: '0.78rem' }}>
                        {errors.currentPassword.message}
                      </div>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small mb-1.5" htmlFor="newPassword">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <Lock
                        size={17}
                        className="position-absolute text-muted"
                        style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        className={`form-control rounded-3 py-2.5 ${errors.newPassword ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: '44px', paddingRight: '44px', minHeight: '46px' }}
                        placeholder="Enter a new strong password"
                        {...register('newPassword')}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute text-muted p-0"
                        style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => setShowNew(!showNew)}
                        tabIndex="-1"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <div className="text-danger small mt-1.5" style={{ fontSize: '0.78rem' }}>
                        {errors.newPassword.message}
                      </div>
                    )}

                    {/* Password Strength Indicator */}
                    {newPasswordValue.length > 0 && (
                      <div className="mt-3 p-3 rounded-3 bg-light border" style={{ borderColor: '#e2e8f0' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <span className="text-muted small">Strength Evaluation:</span>
                          <span className="fw-bold small">{strengthLabel}</span>
                        </div>
                        <div className="progress mb-2.5" style={{ height: '6px', borderRadius: '999px' }}>
                          <div
                            className={`progress-bar ${strengthColor}`}
                            role="progressbar"
                            style={{ width: `${strengthPercentage}%`, borderRadius: '999px', transition: 'all 0.3s ease' }}
                            aria-valuenow={strengthPercentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>

                        <div className="row g-2">
                          <div className="col-6">
                            <span className={`small d-flex align-items-center gap-1.5 ${hasMinLength ? 'text-success fw-medium' : 'text-muted'}`}>
                              {hasMinLength ? <Check size={13} strokeWidth={3} /> : '•'} 8+ Characters
                            </span>
                          </div>
                          <div className="col-6">
                            <span className={`small d-flex align-items-center gap-1.5 ${hasUppercase ? 'text-success fw-medium' : 'text-muted'}`}>
                              {hasUppercase ? <Check size={13} strokeWidth={3} /> : '•'} 1 Uppercase [A-Z]
                            </span>
                          </div>
                          <div className="col-6">
                            <span className={`small d-flex align-items-center gap-1.5 ${hasNumber ? 'text-success fw-medium' : 'text-muted'}`}>
                              {hasNumber ? <Check size={13} strokeWidth={3} /> : '•'} 1 Number [0-9]
                            </span>
                          </div>
                          <div className="col-6">
                            <span className={`small d-flex align-items-center gap-1.5 ${hasSpecial ? 'text-success fw-medium' : 'text-muted'}`}>
                              {hasSpecial ? <Check size={13} strokeWidth={3} /> : '•'} 1 Special Symbol
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small mb-1.5" htmlFor="confirmPassword">
                      Confirm New Password <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <Lock
                        size={17}
                        className="position-absolute text-muted"
                        style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        className={`form-control rounded-3 py-2.5 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: '44px', paddingRight: '44px', minHeight: '46px' }}
                        placeholder="Re-type your new password"
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute text-muted p-0"
                        style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex="-1"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="text-danger small mt-1.5" style={{ fontSize: '0.78rem' }}>
                        {errors.confirmPassword.message}
                      </div>
                    )}
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-4 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 py-2 rounded-3"
                      onClick={() => navigate('/profile')}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-sm"
                      style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', minHeight: '44px' }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Save & Apply Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Account Context & Security Telemetry (5 Cols) */}
        <div className="col-12 col-lg-5">
          <div className="d-flex flex-column gap-3">
            {/* Account Profile Snapshot Card */}
            <div className="bg-white border rounded-4 p-4 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5 flex-shrink-0 shadow-xs"
                  style={{ width: '48px', height: '48px' }}
                >
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="fs-6 fw-bold text-dark mb-0">{user?.fullName || 'Dealership User'}</h4>
                  <div className="text-muted small">{user?.email || 'user@dealeros.local'}</div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle mt-1" style={{ fontSize: '0.7rem' }}>
                    {user?.roles?.[0] || 'ADMINISTRATOR'}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-3 bg-light border d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '0.78rem' }}>
                <Info size={15} className="text-primary flex-shrink-0" />
                <span>Password resets are logged with IP & timestamp in the audit trail.</span>
              </div>
            </div>

            {/* Security Policy Recommendations */}
            <div className="bg-white border rounded-4 p-4 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <h4 className="fs-6 fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-success" /> Security Best Practices
              </h4>
              <p className="text-muted small mb-3">
                Follow enterprise safety protocols to ensure authorized access only:
              </p>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small text-muted">
                <li className="d-flex align-items-start gap-2">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Never reuse passwords from personal or external accounts.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Avoid common words, dealership names, or license plate sequences.</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Always sign out when leaving shared showroom terminals.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

