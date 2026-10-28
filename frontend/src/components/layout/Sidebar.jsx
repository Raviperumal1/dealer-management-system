import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar, setMobileSidebarOpen } from '../../features/ui/uiSlice';
import { usePermission } from '../../hooks/usePermission';
import {
  LayoutDashboard,
  Car,
  Users2,
  ClipboardCheck,
  Wrench,
  Package,
  Truck,
  DollarSign,
  UserCheck,
  CalendarCheck,
  Receipt,
  CreditCard,
  HandCoins,
  History,
  PhoneCall,
  BarChart3,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  FileText,
} from 'lucide-react';

export function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { hasPermission, isAdmin } = usePermission();

  // Submenu expansion state
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Auto-expand submenus
  useEffect(() => {
    if (
      location.pathname.startsWith('/inventory') ||
      location.pathname.startsWith('/suppliers') ||
      location.pathname.startsWith('/costing')
    ) {
      setInventoryExpanded(true);
    }
    if (location.pathname.startsWith('/finance')) {
      setFinanceExpanded(true);
    }
    if (location.pathname.startsWith('/users') || location.pathname.startsWith('/roles')) {
      setSettingsExpanded(true);
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    if (mobileSidebarOpen) {
      dispatch(setMobileSidebarOpen(false));
    }
  };

  const isVehicleActive =
    location.pathname.startsWith('/vehicles') || location.pathname.startsWith('/purchases');
  const isInventoryActive =
    location.pathname.startsWith('/inventory') ||
    location.pathname.startsWith('/suppliers') ||
    location.pathname.startsWith('/costing');
  const isFinanceActive = location.pathname.startsWith('/finance');
  const isSettingsActive =
    location.pathname.startsWith('/users') || location.pathname.startsWith('/roles');

  return (
    <aside
      className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${
        mobileSidebarOpen ? 'mobile-open' : ''
      }`}
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-brand" onClick={handleNavClick}>
          <div
            className="d-flex align-items-center justify-content-center text-white rounded-3 flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Car size={18} strokeWidth={2.2} />
          </div>
          {!sidebarCollapsed && (
            <div className="d-flex flex-column lh-1">
              <span className="fw-bold tracking-tight text-white fs-6" style={{ letterSpacing: '-0.01em' }}>
                DealerOS
              </span>
              <span className="text-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                Dealership DMS
              </span>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          className="btn btn-sm btn-link text-white-50 p-1 d-none d-lg-block"
          onClick={() => dispatch(toggleSidebar())}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {!sidebarCollapsed && <div className="sidebar-group-title">WORKSPACE</div>}

        {/* 1. Dashboard */}
        {(isAdmin || hasPermission('DASHBOARD', 'VIEW')) && (
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </NavLink>
        )}

        {/* 2. Vehicles */}
        {(isAdmin || hasPermission('VEHICLES', 'VIEW')) && (
          <NavLink
            to="/vehicles"
            onClick={handleNavClick}
            className={() => `sidebar-nav-item ${isVehicleActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Vehicles' : undefined}
          >
            <Car className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Vehicles</span>}
          </NavLink>
        )}

        {/* 3. Inspection */}
        {(isAdmin || hasPermission('WORKSHOP', 'VIEW')) && (
          <NavLink
            to="/inspections"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Inspection' : undefined}
          >
            <ClipboardCheck className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Inspection</span>}
          </NavLink>
        )}

        {/* 4. Job Cards */}
        {(isAdmin || hasPermission('WORKSHOP', 'VIEW')) && (
          <NavLink
            to="/job-cards"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Job Cards' : undefined}
          >
            <Wrench className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Job Cards</span>}
          </NavLink>
        )}

        {/* 5. Inventory & Purchasing Module (Expandable Submenu) */}
        {(isAdmin || hasPermission('INVENTORY', 'VIEW')) && (
          <div className="sidebar-nav-group">
            <button
              type="button"
              className={`sidebar-nav-item w-100 border-0 bg-transparent text-start ${
                isInventoryActive ? 'active-parent' : ''
              }`}
              onClick={() => {
                if (sidebarCollapsed) {
                  dispatch(toggleSidebar());
                  setInventoryExpanded(true);
                } else {
                  setInventoryExpanded(!inventoryExpanded);
                }
              }}
              title={sidebarCollapsed ? 'Inventory' : undefined}
            >
              <Package className="sidebar-nav-icon" size={18} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-grow-1">Inventory & Purchases</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      inventoryExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {!sidebarCollapsed && inventoryExpanded && (
              <div className="sidebar-subnav ps-4 ms-2 border-start border-secondary border-opacity-25 mt-1 mb-2">
                <NavLink
                  to="/inventory"
                  end
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Spare Parts Inventory
                </NavLink>

                <NavLink
                  to="/suppliers"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Suppliers / Parts Agencies
                </NavLink>

                <NavLink
                  to="/inventory/invoices"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Purchase Orders & Bills
                </NavLink>

                <NavLink
                  to="/suppliers?tab=payments"
                  onClick={handleNavClick}
                  className={() => `sidebar-subnav-item ${location.pathname === '/suppliers' && location.search.includes('tab=payments') ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Supplier Payments
                </NavLink>

                <NavLink
                  to="/inventory/movements"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Stock Movements
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* 6. Sales */}
        {(isAdmin || hasPermission('SALES', 'VIEW')) && (
          <NavLink
            to="/sales"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Sales' : undefined}
          >
            <Receipt className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Sales</span>}
          </NavLink>
        )}

        {/* 7. Finance & Loans (Direct NavLink) */}
        {(isAdmin || hasPermission('FINANCE', 'VIEW')) && (
          <NavLink
            to="/finance"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Finance & Loans' : undefined}
          >
            <CreditCard className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Finance & Loans</span>}
          </NavLink>
        )}

        {/* 7b. Centralized Documents Vault & NOC Center */}
        {(isAdmin || hasPermission('FINANCE', 'VIEW')) && (
          <NavLink
            to="/documents"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Documents & NOCs' : undefined}
          >
            <FileText className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Documents & NOC</span>}
          </NavLink>
        )}


        {/* 8. Brokers */}
        {(isAdmin || hasPermission('BROKERS', 'VIEW')) && (
          <NavLink
            to="/brokers"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Brokers' : undefined}
          >
            <Users2 className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Brokers</span>}
          </NavLink>
        )}

        {/* 8. Customers */}
        {(isAdmin || hasPermission('CUSTOMERS', 'VIEW')) && (
          <NavLink
            to="/customers"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Customers' : undefined}
          >
            <UserCheck className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Customers</span>}
          </NavLink>
        )}

        {/* 9. Service */}
        {(isAdmin || hasPermission('SERVICE', 'VIEW')) && (
          <NavLink
            to="/service"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Service' : undefined}
          >
            <History className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Service</span>}
          </NavLink>
        )}

        {/* 10. Reports */}
        {(isAdmin || hasPermission('REPORTS', 'VIEW')) && (
          <NavLink
            to="/reports"
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Reports' : undefined}
          >
            <BarChart3 className="sidebar-nav-icon" size={18} />
            {!sidebarCollapsed && <span>Reports</span>}
          </NavLink>
        )}

        {/* 11. Settings & Administration */}
        {isAdmin && (
          <div className="sidebar-nav-group mt-1">
            <button
              type="button"
              className={`sidebar-nav-item w-100 border-0 bg-transparent text-start ${
                isSettingsActive ? 'active-parent' : ''
              }`}
              onClick={() => {
                if (sidebarCollapsed) {
                  dispatch(toggleSidebar());
                  setSettingsExpanded(true);
                } else {
                  setSettingsExpanded(!settingsExpanded);
                }
              }}
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <Settings className="sidebar-nav-icon" size={18} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-grow-1">Settings</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      settingsExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {!sidebarCollapsed && settingsExpanded && (
              <div className="sidebar-subnav ps-4 ms-2 border-start border-secondary border-opacity-25 mt-1 mb-2">
                <NavLink
                  to="/users"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  User Accounts
                </NavLink>
                <NavLink
                  to="/roles"
                  onClick={handleNavClick}
                  className={({ isActive }) => `sidebar-subnav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-dot" />
                  Roles & Permissions
                </NavLink>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="sidebar-footer">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
          style={{
            width: '36px',
            height: '36px',
            fontSize: '0.85rem',
            backgroundColor: '#374151',
            border: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden flex-grow-1">
            <div className="small fw-semibold text-white text-truncate">
              {user?.fullName || user?.username || 'Administrator'}
            </div>
            <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
              {Array.isArray(user?.roles) ? user.roles[0]?.replace('ROLE_', '') : 'ADMIN'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
