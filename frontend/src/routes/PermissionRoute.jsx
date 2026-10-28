import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { ShieldX } from 'lucide-react';

export function PermissionRoute({ menuCode, action = 'VIEW', children }) {
  const { hasPermission, isAdmin } = usePermission();

  const allowed = isAdmin || hasPermission(menuCode, action);

  if (!allowed) {
    return (
      <div className="text-center py-5">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle mb-3"
          style={{ width: '64px', height: '64px' }}
        >
          <ShieldX size={32} />
        </div>
        <h2 className="h4 fw-bold text-dark mb-1">Access Restricted</h2>
        <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '420px' }}>
          You do not have permission to access the <strong>{menuCode}</strong> module.
          Please contact your dealership system administrator to grant your role appropriate authorization.
        </p>
        <a href="/dashboard" className="btn btn-sm btn-outline-primary">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return children;
}

export default PermissionRoute;
