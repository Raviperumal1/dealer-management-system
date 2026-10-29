/**
 * Formats vehicle registration number into standard spaced Indian format.
 * Example: 'MH12AB1234' -> 'MH 12 AB 1234'
 */
export function formatRegNumber(regNo) {
  if (!regNo) return '—';
  const clean = regNo.toUpperCase().replace(/\s+/g, '');
  const match = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})?(\d{4})$/);
  if (match) {
    const [, state, rto, series, num] = match;
    return `${state} ${rto} ${series ? series + ' ' : ''}${num}`.trim();
  }
  return clean;
}

/**
 * Formats a phone number.
 */
export function formatPhone(phone) {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
}

/**
 * Formats odometer kilometre reading.
 * Example: 45000 -> '45,000 km'
 */
export function formatKilometres(km) {
  if (km === null || km === undefined) return '—';
  return `${new Intl.NumberFormat('en-IN').format(km)} km`;
}

/**
 * Formats percentage.
 * Example: 18 -> '18%'
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  const num = Number(value);
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats file size in bytes to human readable string.
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:image')) return url;

  // Use configured backend base URL (e.g. https://dealer-management-system-backend.onrender.com/api/v1.0)
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1.0').replace(/\/+$/, '');

  // If path already starts with /api/v1.0
  if (url.startsWith('/api/v1.0/')) {
    const subPath = url.substring('/api/v1.0'.length);
    return `${apiBase}${subPath}`;
  }

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // If URL is already in /documents/... format
  if (cleanUrl.startsWith('/documents/')) {
    if (cleanUrl.endsWith('/download')) {
      return `${apiBase}${cleanUrl}`;
    }
    return `${apiBase}${cleanUrl}/download`;
  }

  if (cleanUrl.startsWith('/uploads/')) {
    return `${apiBase}${cleanUrl}`;
  }

  // Bare UUID or filename: resolve to /documents/{url}/download
  return `${apiBase}/documents/${url}/download`;
}

/**
 * Formats a currency number in INR format.
 * Example: 83000 -> '₹ 83,000.00'
 */
export function formatCurrency(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return includeSymbol ? '₹ 0.00' : '0.00';
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `₹ ${formatted}` : formatted;
}

