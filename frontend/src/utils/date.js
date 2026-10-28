import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

/**
 * Formats an ISO date string or Date object into human readable date.
 * Example: '2026-10-13' -> '13 Oct 2026'
 */
export function formatDate(dateInput, pattern = 'dd MMM yyyy') {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '—';
    return format(date, pattern);
  } catch {
    return '—';
  }
}

/**
 * Formats date and time.
 * Example: '2026-10-13T10:30:00' -> '13 Oct 2026, 10:30 AM'
 */
export function formatDateTime(dateInput) {
  return formatDate(dateInput, 'dd MMM yyyy, hh:mm a');
}

/**
 * Formats relative time from now.
 * Example: '2 days ago', 'in 3 hours'
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}
