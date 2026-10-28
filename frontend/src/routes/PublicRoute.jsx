import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function PublicRoute({ children }) {
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

export default PublicRoute;
