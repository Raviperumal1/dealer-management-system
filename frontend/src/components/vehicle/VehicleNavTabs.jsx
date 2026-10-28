import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VehicleNavTabs.css';

/**
 * VehicleNavTabs - Modern Horizontal Capsule Tab Bar
 * Replaces vertical sidebar submenus with a sleek, pill-shaped horizontal navigation bar.
 * Matches design specification:
 * - Rounded pill container with soft background & smooth inset/border
 * - Active pill tab with white elevation & dark bold typography
 * - Inactive tabs with muted text, smooth hover lift & subtle styling
 * - Red notification badge for active stock count or attention counts
 * - Fully responsive with horizontal scroll and no scrollbar artifacts
 */
export function VehicleNavTabs({ counts = {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const ownershipParam = searchParams.get('ownership');

  const tabs = [
    {
      id: 'all',
      label: 'All Vehicles',
      path: '/vehicles',
      isActive: currentPath === '/vehicles' && !ownershipParam,
      badge: counts.all ?? null,
      badgeVariant: 'neutral',
    },
    {
      id: 'own',
      label: 'Own Vehicles',
      path: '/vehicles?ownership=OWN',
      isActive: currentPath === '/vehicles' && ownershipParam === 'OWN',
      badge: counts.own ?? null,
      badgeVariant: 'neutral',
    },
    {
      id: 'broker',
      label: 'Broker Vehicles',
      path: '/vehicles?ownership=BROKER',
      isActive: currentPath === '/vehicles' && ownershipParam === 'BROKER',
      badge: counts.broker ?? null,
      badgeVariant: 'neutral',
    },
    {
      id: 'available',
      label: 'Available Stock',
      path: '/vehicles/available',
      isActive: currentPath === '/vehicles/available',
      badge: counts.available ?? null,
      badgeVariant: 'accent', // Red notification badge as shown in image
    },
    {
      id: 'purchases',
      label: 'Purchases Log',
      path: '/purchases',
      isActive: currentPath === '/purchases',
      badge: counts.purchases ?? null,
      badgeVariant: 'neutral',
    },
  ];

  return (
    <div className="vehicle-tabs-wrapper">
      <div className="vehicle-pill-container" role="tablist" aria-label="Vehicle Modules">
        {tabs.map((tab) => {
          const isSelected = tab.isActive;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isSelected}
              className={`vehicle-pill-tab ${isSelected ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="vehicle-pill-label">{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  className={`vehicle-pill-badge ${
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

export default VehicleNavTabs;
