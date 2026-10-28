import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Car, ClipboardCheck, TrendingUp, Settings } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, dismissError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    dismissError();
    try {
      await login(data);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch {
      // Error handled by authSlice
    }
  };

  return (
    <div className="min-vh-100 d-flex bg-white overflow-hidden">
      {/* LEFT 50% PANEL: Immersive DealerOS Showroom Hero Banner */}
      <div
        className="d-none d-lg-flex col-lg-6 position-relative flex-column justify-content-between p-5 text-white overflow-hidden"
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0f1d',
        }}
      >
        {/* Showroom Background Image with flat dark scrim */}
        <img
          src="/dealer-login-hero.jpg"
          alt="Dealership Showroom"
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            objectFit: 'cover',
            objectPosition: 'center 42%',
            zIndex: 0,
            opacity: 0.28,
          }}
        />

        {/* Top Header Logo */}
        <div className="position-relative d-flex align-items-center gap-2.5" style={{ zIndex: 2 }}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Car size={18} className="text-white" />
          </div>
          <div>
            <div
              className="fw-bold tracking-tight text-white"
              style={{ fontSize: '1.1rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}
            >
              DealerOS
            </div>
            <div
              className="text-muted small"
              style={{ fontSize: '0.75rem', marginTop: '1px' }}
            >
              Enterprise Dealership Management
            </div>
          </div>
        </div>

        {/* Center Headline */}
        <div className="position-relative my-auto py-5" style={{ maxWidth: '520px', zIndex: 2 }}>
          <p
            className="text-secondary mb-2"
            style={{ fontSize: '0.825rem' }}
          >
            Automotive retail and workshop operations
          </p>
          <h2
            className="fw-bold text-white mb-3"
            style={{
              fontSize: '2rem',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Your dealership operations on one unified platform.
          </h2>
          <p
            className="text-white text-opacity-75 fs-6 lh-base mb-0"
            style={{ maxWidth: '460px' }}
          >
            Real-time management across vehicle inventory, multi-point inspections, sales billing, finance loan amortization, and workshop job cards.
          </p>
        </div>

        {/* Bottom Feature Capabilities Bar */}
        <div
          className="position-relative d-flex align-items-center gap-3 flex-wrap pt-4 border-top border-secondary border-opacity-25"
          style={{ zIndex: 2 }}
        >
          <div className="d-flex align-items-center gap-1.5 text-secondary small">
            <Car size={15} />
            <span>Inventory</span>
          </div>
          <span className="text-secondary opacity-50">•</span>
          <div className="d-flex align-items-center gap-1.5 text-secondary small">
            <ClipboardCheck size={15} />
            <span>Inspections</span>
          </div>
          <span className="text-secondary opacity-50">•</span>
          <div className="d-flex align-items-center gap-1.5 text-secondary small">
            <TrendingUp size={15} />
            <span>Sales & Finance</span>
          </div>
          <span className="text-secondary opacity-50">•</span>
          <div className="d-flex align-items-center gap-1.5 text-secondary small">
            <Settings size={15} />
            <span>Service & Job Cards</span>
          </div>
        </div>
      </div>

      {/* RIGHT 50% PANEL: Clean, Focused Login Interface */}
      <div className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5 bg-white min-vh-100 overflow-y-auto">
        {/* Top Header Row */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <span className="text-muted small fw-medium">
            Dealership workspace
          </span>
          <span
            className="d-flex align-items-center gap-1.5 px-2.5 py-0.5 rounded-pill border small"
            style={{
              borderColor: '#e2e8f0',
              backgroundColor: '#f8fafc',
              fontSize: '0.75rem',
              color: '#475569',
            }}
          >
            <span
              className="rounded-circle bg-success"
              style={{ width: '6px', height: '6px', display: 'inline-block' }}
            />
            Secure access
          </span>
        </div>

        {/* Center Main Form */}
        <div className="my-auto py-4" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <div className="mb-4">
            <h1 className="fw-bold text-dark mb-1.5" style={{ letterSpacing: '-0.02em', fontSize: '1.65rem' }}>
              Welcome back
            </h1>
            <p className="text-muted small mb-0">
              Sign in to manage your dealership workspace.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 px-3 small d-flex align-items-center gap-2 mb-4 rounded-3 border-danger-subtle" role="alert">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username / Email Field */}
            <div className="mb-3.5">
              <label htmlFor="usernameInput" className="form-label text-dark fw-medium small mb-1.5">
                Username or email
              </label>
              <div className="position-relative">
                <Mail
                  size={18}
                  className="position-absolute text-muted"
                  style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="usernameInput"
                  type="text"
                  className={`form-control rounded-3 py-2.5 ${errors.username ? 'is-invalid' : ''}`}
                  style={{
                    paddingLeft: '44px',
                    borderColor: '#e2e8f0',
                    fontSize: '0.92rem',
                    backgroundColor: '#ffffff',
                    minHeight: '46px',
                  }}
                  placeholder="admin or admin@dealership.com"
                  {...register('username')}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && (
                <div className="invalid-feedback d-block small mt-1">
                  {errors.username.message}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-3.5">
              <label htmlFor="passwordInput" className="form-label text-dark fw-medium small mb-1.5">
                Password
              </label>
              <div className="position-relative">
                <Lock
                  size={18}
                  className="position-absolute text-muted"
                  style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control rounded-3 py-2.5 ${errors.password ? 'is-invalid' : ''}`}
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    borderColor: '#e2e8f0',
                    fontSize: '0.92rem',
                    backgroundColor: '#ffffff',
                    minHeight: '46px',
                  }}
                  placeholder="Enter Your Password"
                  {...register('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute text-muted p-0"
                  style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block small mt-1">
                  {errors.password.message}
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check d-flex align-items-center gap-2 mb-0">
                <input
                  id="rememberMeCheckbox"
                  type="checkbox"
                  className="form-check-input mt-0"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', width: '1.05rem', height: '1.05rem' }}
                />
                <label
                  htmlFor="rememberMeCheckbox"
                  className="form-check-label text-muted small user-select-none"
                  style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Remember my email or mobile
                </label>
              </div>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your Dealership Administrator to reset your password.');
                }}
                className="text-primary text-decoration-none small fw-medium"
                style={{ fontSize: '0.85rem' }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              id="loginSubmitBtn"
              type="submit"
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style={{
                fontSize: '0.92rem',
                minHeight: '46px',
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Empty spacer to keep vertical balance */}
        <div style={{ height: '24px' }} />
      </div>
    </div>
  );
}

export default LoginPage;


