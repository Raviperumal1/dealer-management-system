import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleMobileSidebar } from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import {
  Menu,
  Bell,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import SearchInput from '../common/SearchInput';

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleGlobalSearch = (val) => {
    setGlobalQuery(val);
    if (val && val.length > 2) {
      // Navigate to vehicle list with search query
      navigate(`/vehicles?search=${encodeURIComponent(val)}`);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={() => dispatch(toggleMobileSidebar())}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={18} />
        </button>

        <div className="d-none d-md-block">
          <SearchInput
            placeholder="Search vehicles, reg no, customers..."
            value={globalQuery}
            onChange={handleGlobalSearch}
          />
        </div>
      </div>

      <div className="header-right">
        {/* Notifications Icon */}
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-sm btn-link text-muted p-1 position-relative"
            aria-label="View notifications"
            onClick={() => navigate('/service')}
            title="Service reminders & alerts"
          >
            <Bell size={20} />
            <span
              className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              style={{ width: '8px', height: '8px' }}
            >
              <span className="visually-hidden">New alerts</span>
            </span>
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-sm btn-link text-dark text-decoration-none d-flex align-items-center gap-2 p-1"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="text-start d-none d-sm-block">
              <div className="fw-semibold small lh-1 mb-1">
                {user?.fullName || user?.username || 'Staff'}
              </div>
              <div className="text-muted lh-1" style={{ fontSize: '0.72rem' }}>
                {Array.isArray(user?.roles) ? user.roles[0]?.replace('ROLE_', '') : 'STAFF'}
              </div>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {dropdownOpen && (
            <div
              className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border rounded-3 py-1"
              style={{ top: '100%', right: 0, minWidth: '190px', zIndex: 1050 }}
            >
              <div className="px-3 py-2 border-bottom">
                <p className="small fw-bold mb-0 text-dark">{user?.fullName || user?.username}</p>
                <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{user?.email || 'user@dealership.com'}</p>
              </div>

              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 py-2 small"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
              >
                <User size={15} /> My Profile
              </button>

              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 py-2 small"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/change-password');
                }}
              >
                <KeyRound size={15} /> Change Password
              </button>

              <div className="dropdown-divider my-1" />

              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 py-2 small text-danger"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
