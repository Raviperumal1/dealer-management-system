import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className={`p-2 rounded-circle bg-${confirmVariant === 'danger' ? 'danger-subtle text-danger' : 'warning-subtle text-warning'} flex-shrink-0`}
              >
                <AlertTriangle size={24} />
              </div>
              <div className="flex-grow-1">
                <h5 className="modal-title h6 fw-bold text-dark mb-1">{title}</h5>
                <p className="text-muted small mb-0">{message}</p>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-light px-4 py-2 border-0 rounded-bottom-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-${confirmVariant}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
