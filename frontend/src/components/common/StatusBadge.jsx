import React from 'react';

export function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  // Ownership badge
  if (type === 'ownership') {
    if (normalized === 'OWN') {
      return <span className="badge-own">OWN FLEET</span>;
    }
    if (normalized === 'BROKER') {
      return <span className="badge-broker">BROKER</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  }

  // Determine variant
  let variant = 'neutral';
  let label = status.replace(/_/g, ' ');
  if (normalized === 'INSPECTION') label = 'Under Inspection';
  if (normalized === 'REPAIR') label = 'Under Repair';
  if (normalized === 'JOB_CARD') label = 'Job Card';

  switch (normalized) {
    // Positive / Success
    case 'AVAILABLE':
    case 'READY_FOR_SALE':
    case 'COMPLETED':
    case 'PAID':
    case 'ACTIVE':
    case 'DELIVERED':
    case 'GOOD':
    case 'CLOSED':
      variant = 'success';
      break;

    // Pending / Warning
    case 'BOOKED':
    case 'INSPECTION':
    case 'UNDER_INSPECTION':
    case 'JOB_CARD':
    case 'IN_PROGRESS':
    case 'PARTIALLY_PAID':
    case 'WAITING_FOR_PARTS':
    case 'NEED_REPAIR':
    case 'PENDING_PAYMENT':
    case 'PENDING':
    case 'UPCOMING':
    case 'DUE':
      variant = 'warning';
      break;

    // Critical / Danger
    case 'OVERDUE':
    case 'CANCELLED':
    case 'REPLACE':
    case 'INACTIVE':
      variant = 'danger';
      break;

    // Informational / Transition
    case 'PURCHASED':
    case 'BROKER_LISTED':
    case 'SOLD':
    case 'REPAIR':
    case 'UNDER_REPAIR':
    case 'OPEN':
      variant = 'info';
      break;

    default:
      variant = 'neutral';
  }

  return (
    <span className={`badge-status badge-status-${variant}`}>
      <span className="badge-status-dot" />
      {label}
    </span>
  );
}

export default StatusBadge;
