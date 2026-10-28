import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/common/StatusBadge';
import MoneyDisplay from '../components/common/MoneyDisplay';

describe('Common Components', () => {
  it('renders StatusBadge with appropriate text and styling class', () => {
    const { rerender } = render(<StatusBadge status="AVAILABLE" />);
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();

    rerender(<StatusBadge status="BOOKED" />);
    expect(screen.getByText('BOOKED')).toBeInTheDocument();

    rerender(<StatusBadge status="SOLD" />);
    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });

  it('renders MoneyDisplay with formatted INR currency', () => {
    render(<MoneyDisplay amount={450000} />);
    const el = screen.getByText(/4,50,000/);
    expect(el).toBeInTheDocument();
  });
});
