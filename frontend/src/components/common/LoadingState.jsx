import React from 'react';

export function LoadingState({ message = 'Loading data...', rows = 5 }) {
  return (
    <div className="py-4">
      <div className="d-flex align-items-center justify-content-center mb-3 text-muted">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="small">{message}</span>
      </div>
      <div className="d-flex flex-column gap-2 px-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="skeleton"
            style={{ height: '36px', width: '100%' }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="app-card p-4">
      <div className="skeleton mb-3" style={{ height: '24px', width: '40%' }} />
      <div className="skeleton mb-2" style={{ height: '16px', width: '80%' }} />
      <div className="skeleton" style={{ height: '16px', width: '60%' }} />
    </div>
  );
}

export default LoadingState;
