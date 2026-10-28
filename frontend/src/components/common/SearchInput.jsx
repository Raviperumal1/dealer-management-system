import React from 'react';
import { Search, X } from 'lucide-react';
import './FilterBar.css';

/**
 * SearchInput - Universal Executive Search Input
 * Features rounded container, search icon, clear button, and focus styling.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  id = 'global-search-input',
  style = {},
}) {
  return (
    <div className={`universal-search-wrapper ${className}`} style={{ minWidth: '240px', ...style }}>
      <Search size={15} className="universal-search-icon" />
      <input
        id={id}
        type="text"
        className="universal-search-input"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="universal-search-clear"
          onClick={() => onChange('')}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
