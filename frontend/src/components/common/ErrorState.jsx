import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Failed to load data',
  message = 'An error occurred while connecting to the server. Please check your network or try again.',
  onRetry,
}) {
  return (
    <div className="alert alert-danger d-flex align-items-start gap-3 my-3 p-3 rounded-3 shadow-xs" role="alert">
      <AlertCircle size={22} className="text-danger flex-shrink-0 mt-1" />
      <div className="flex-grow-1">
        <h4 className="alert-heading h6 fw-bold mb-1">{title}</h4>
        <p className="mb-2 small">{message}</p>
        {onRetry && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
            onClick={onRetry}
          >
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
