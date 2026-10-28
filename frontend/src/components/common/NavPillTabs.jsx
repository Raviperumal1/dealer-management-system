import React from 'react';
import './NavPillTabs.css';

/**
 * NavPillTabs - Universal Horizontal Capsule / Pill Navigation Component
 * Uniformly styled to match the executive capsule tab design language:
 * - Rounded capsule container with subtle neutral background (#f1f3f7)
 * - Pure white elevated active pill tab with smooth shadow
 * - Sleek typography with hover states
 * - Circular accent notification badges (e.g. red for urgency/available, neutral for counts)
 * - Horizontal smooth touch scrolling on mobile without ugly scrollbars
 *
 * Props:
 * - tabs: Array<{ id, label, icon: ReactNode, badge: number|string, badgeVariant: 'accent'|'neutral', onClick: func, isActive: boolean }>
 * - className: string
 */
export function NavPillTabs({ tabs = [], className = '' }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className={`nav-pill-tabs-wrapper ${className}`}>
      <div className="nav-pill-container" role="tablist">
        {tabs.map((tab) => {
          const isSelected = Boolean(tab.isActive);
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isSelected}
              className={`nav-pill-tab ${isSelected ? 'active' : ''}`}
              onClick={tab.onClick}
            >
              {tab.icon && <span className="nav-pill-icon">{tab.icon}</span>}
              <span className="nav-pill-label">{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  className={`nav-pill-badge ${
                    tab.badgeVariant === 'accent' ? 'badge-accent' : 'badge-neutral'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NavPillTabs;
