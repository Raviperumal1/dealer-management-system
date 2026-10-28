import React from 'react';
import { RotateCcw } from 'lucide-react';
import './FilterBar.css';

/**
 * FilterBar - Universal Executive Filter Ribbon Component
 * Provides a clean glass-like container matching Vehicle Fleet management
 * across all dashboard list views.
 */
export function FilterBar({ children, onReset, hasActiveFilters = false, className = '' }) {
  return (
    <div className={`universal-filter-ribbon ${className}`}>
      <div className="universal-filter-ribbon-inner">
        <div className="universal-filter-controls">
          {children}
        </div>
        {hasActiveFilters && onReset && (
          <button
            type="button"
            className="universal-filter-reset-btn"
            onClick={onReset}
            title="Reset active filters"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
