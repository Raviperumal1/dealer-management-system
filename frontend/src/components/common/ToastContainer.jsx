import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../features/ui/uiSlice';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

function ToastItem({ toast, onRemove }) {
  const duration = toast.duration || 4500; // 4.5s default

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-success flex-shrink-0" />;
      case 'error':
        return <AlertCircle size={18} className="text-danger flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning flex-shrink-0" />;
      default:
        return <Info size={18} className="text-primary flex-shrink-0" />;
    }
  };

  return (
    <div
      className="toast show border-0 shadow-lg rounded-3 bg-white overflow-hidden position-relative animate-fade-in"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        transition: 'all 0.25s ease-in-out',
        borderLeft: `4px solid ${
          toast.type === 'success'
            ? '#16a34a'
            : toast.type === 'error'
            ? '#dc2626'
            : toast.type === 'warning'
            ? '#d97706'
            : '#2563eb'
        }`,
      }}
    >
      <div className="d-flex align-items-center justify-content-between p-3">
        <div className="d-flex align-items-start gap-2.5">
          <span className="mt-0.5">{getIcon(toast.type)}</span>
          <div>
            {toast.title && <h6 className="mb-0.5 fw-semibold text-dark fs-6">{toast.title}</h6>}
            <p className="mb-0 small text-muted lh-sm">{toast.message}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-close ms-2 flex-shrink-0"
          aria-label="Close"
          onClick={() => onRemove(toast.id)}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui.toasts);

  const handleRemove = React.useCallback(
    (id) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 2000, maxWidth: '380px', width: '100%' }}
    >
      <div className="d-flex flex-column gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  );
}

export default ToastContainer;
