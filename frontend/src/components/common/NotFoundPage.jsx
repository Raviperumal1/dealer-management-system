import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Home } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3 py-5">
      <div className="text-center" style={{ maxWidth: '480px' }}>
        <div
          className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-4"
          style={{ width: '80px', height: '80px' }}
        >
          <Car size={40} />
        </div>
        <h1 className="display-4 fw-bold text-dark mb-2">404</h1>
        <h2 className="h4 fw-bold text-dark mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          The requested dealership management module, record, or page could not be found. Please check the URL or return to the main dashboard.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={16} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
