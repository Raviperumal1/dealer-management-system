import { describe, it, expect } from 'vitest';
import { formatINR, formatINRShorthand } from '../utils/currency';

describe('currency utility', () => {
  it('formats Indian Rupees without decimals', () => {
    const formatted = formatINR(580000);
    // Remove non-breaking spaces if any from Intl formatting
    const cleaned = formatted.replace(/\u00a0/g, ' ');
    expect(cleaned).toContain('₹5,80,000');
  });

  it('formats zero correctly', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('rounds decimal numbers to whole numbers (e.g. 789.98 -> 790)', () => {
    const formatted = formatINR(789.98).replace(/\u00a0/g, ' ');
    expect(formatted).toContain('₹790');
    const roundedDec = formatINR(1250000.5, true).replace(/\u00a0/g, ' ');
    expect(roundedDec).toContain('₹12,50,001');
  });

  it('formats shorthand Lakhs and Crores', () => {
    expect(formatINRShorthand(580000)).toBe('₹5.80 L');
    expect(formatINRShorthand(15000000)).toBe('₹1.50 Cr');
    expect(formatINRShorthand(25000)).toContain('25,000');
  });
});
