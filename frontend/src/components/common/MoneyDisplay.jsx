import React from 'react';
import { formatINR, formatINRShorthand } from '../../utils/currency';

export function MoneyDisplay({
  amount,
  showDecimals = false,
  shorthand = false,
  className = '',
  colorVariant = null, // 'success' | 'danger' | 'warning' | 'primary' | 'muted'
}) {
  const formatted = shorthand ? formatINRShorthand(amount) : formatINR(amount, showDecimals);

  let colorClass = '';
  if (colorVariant) {
    colorClass = `text-${colorVariant}`;
  }

  return <span className={`money-inr ${colorClass} ${className}`}>{formatted}</span>;
}

export default MoneyDisplay;
