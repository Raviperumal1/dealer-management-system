/**
 * Formats a numeric value or numeric string into Indian Rupee (INR) currency format.
 * Example: 580000 -> ₹5,80,000
 * Example: 1250000.50 -> ₹12,50,000.50
 *
 * @param {number|string|null|undefined} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show paise decimals
 * @returns {string} Formatted Indian Rupee string
 */
export function formatINR(amount, showDecimals = false) {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0';
  }

  const raw = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(raw)) {
    return '₹0';
  }

  // Round off any decimal numbers to whole numbers (e.g. 789.98 -> 790)
  const num = Math.round(raw);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats large amounts into Indian Lakhs or Crores shorthand.
 * Example: 580000 -> ₹5.80 L
 * Example: 15000000 -> ₹1.50 Cr
 */
export function formatINRShorthand(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';

  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return formatINR(num, false);
}
