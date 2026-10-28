import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error?.message ||
    (typeof error === 'string' ? error : 'An unexpected application error occurred while rendering this view.');

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3 py-5">
      <div className="app-card shadow-sm border p-4 text-center" style={{ maxWidth: '580px', width: '100%' }}>
        <div
          className="d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle mb-3"
          style={{ width: '64px', height: '64px' }}
        >
          <AlertTriangle size={32} />
        </div>
        <h2 className="h4 fw-bold text-dark mb-2">Something went wrong</h2>
        <p className="text-muted small mb-4">
          The application encountered an error while loading this screen. You can try refreshing the page or navigate back to the dashboard.
        </p>

        <div className="alert alert-danger bg-danger-subtle border-0 text-start py-2 px-3 small rounded-3 mb-4 font-monospace">
          <div className="fw-bold mb-1">Error Details:</div>
          <div className="text-break">{errorMessage}</div>
        </div>

        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} /> Reload Page
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={15} /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
