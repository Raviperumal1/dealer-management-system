import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your criteria or in this section yet.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-light text-muted rounded-circle mb-3"
        style={{ width: '64px', height: '64px' }}
      >
        <Icon size={28} />
      </div>
      <h3 className="h6 fw-semibold text-dark mb-1">{title}</h3>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-sm btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
