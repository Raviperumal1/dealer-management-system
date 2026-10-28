import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing) {
    return (
      <div className="d-flex vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading system...</span>
          </div>
          <p className="small text-muted mb-0">Initializing AutoManage DMS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
