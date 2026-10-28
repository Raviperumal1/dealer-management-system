import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setMobileSidebarOpen } from '../../features/ui/uiSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../common/ToastContainer';

export function AppLayout() {
  const dispatch = useDispatch();
  const mobileSidebarOpen = useSelector((state) => state.ui.mobileSidebarOpen);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Main Collapsible Sidebar */}
      <Sidebar />

      {/* Content Viewport */}
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
}

export default AppLayout;
