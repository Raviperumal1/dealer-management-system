import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../routes/ProtectedRoute';
import PermissionRoute from '../routes/PermissionRoute';
import PublicRoute from '../routes/PublicRoute';
import LoadingState from '../components/common/LoadingState';
import NotFoundPage from '../components/common/NotFoundPage';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';

// Lazy-loaded Feature Pages for optimized code-splitting
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const ProfilePage = lazy(() => import('../features/auth/ProfilePage'));
const ChangePasswordPage = lazy(() => import('../features/auth/ChangePasswordPage'));

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));

const VehicleListPage = lazy(() => import('../features/vehicles/VehicleListPage'));
const AvailableVehiclesPage = lazy(() => import('../features/vehicles/AvailableVehiclesPage'));
const VehicleDetailPage = lazy(() => import('../features/vehicles/VehicleDetailPage'));
const VehicleFormPage = lazy(() => import('../features/vehicles/VehicleFormPage'));

const PurchasesPage = lazy(() => import('../features/purchases/PurchasesPage'));

const BrokerListPage = lazy(() => import('../features/brokers/BrokerListPage'));
const BrokerDetailPage = lazy(() => import('../features/brokers/BrokerDetailPage'));
const SettlementListPage = lazy(() => import('../features/settlements/SettlementListPage'));
const SettlementDetailPage = lazy(() => import('../features/settlements/SettlementDetailPage'));

const InspectionListPage = lazy(() => import('../features/inspections/InspectionListPage'));
const InspectionCreatePage = lazy(() => import('../features/inspections/InspectionCreatePage'));
const InspectionDetailPage = lazy(() => import('../features/inspections/InspectionDetailPage'));

const JobCardListPage = lazy(() => import('../features/jobCards/JobCardListPage'));
const JobCardCreatePage = lazy(() => import('../features/jobCards/JobCardCreatePage'));
const JobCardDetailPage = lazy(() => import('../features/jobCards/JobCardDetailPage'));

const PartsListPage = lazy(() => import('../features/inventory/PartsListPage'));
const PurchaseInvoicesPage = lazy(() => import('../features/inventory/PurchaseInvoicesPage'));
const StockMovementsPage = lazy(() => import('../features/inventory/StockMovementsPage'));
const SupplierListPage = lazy(() => import('../features/suppliers/SupplierListPage'));

const CostingPage = lazy(() => import('../features/costing/CostingPage'));

const CustomerListPage = lazy(() => import('../features/customers/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('../features/customers/CustomerDetailPage'));

const BookingListPage = lazy(() => import('../features/bookings/BookingListPage'));
const SalesListPage = lazy(() => import('../features/sales/SalesListPage'));
const SaleCreatePage = lazy(() => import('../features/sales/SaleCreatePage'));
const SaleDetailPage = lazy(() => import('../features/sales/SaleDetailPage'));
const DeliveryListPage = lazy(() => import('../features/deliveries/DeliveryListPage'));

const FinanceListPage = lazy(() => import('../features/finance/FinanceListPage'));
const FinanceDetailPage = lazy(() => import('../features/finance/FinanceDetailPage'));
const DocumentsPage = lazy(() => import('../features/documents/DocumentsPage'));

const ServiceDashboardPage = lazy(() => import('../features/services/ServiceDashboardPage'));
const CreateServiceRecordPage = lazy(() => import('../features/services/CreateServiceRecordPage'));
const FollowUpListPage = lazy(() => import('../features/followups/FollowUpListPage'));

const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));

const UserListPage = lazy(() => import('../features/users/UserListPage'));
const RoleListPage = lazy(() => import('../features/roles/RoleListPage'));

// Suspense wrapper for lazy components
const LazyLoad = ({ children }) => (
  <Suspense
    fallback={
      <div className="p-4">
        <LoadingState rows={4} />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public Route
  {
    path: '/login',
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <LazyLoad>
          <LoginPage />
        </LazyLoad>
      </PublicRoute>
    ),
  },

  // Authenticated Application Shell
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <PermissionRoute menuCode="DASHBOARD" action="VIEW">
            <LazyLoad>
              <DashboardPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Vehicles & Purchases
      {
        path: 'vehicles',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="VIEW">
            <LazyLoad>
              <VehicleListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'vehicles/available',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="VIEW">
            <LazyLoad>
              <AvailableVehiclesPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'vehicles/new',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="ADD">
            <LazyLoad>
              <VehicleFormPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'vehicles/:id/edit',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="EDIT">
            <LazyLoad>
              <VehicleFormPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'vehicles/:id',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="VIEW">
            <LazyLoad>
              <VehicleDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'purchases',
        element: (
          <PermissionRoute menuCode="VEHICLES" action="VIEW">
            <LazyLoad>
              <PurchasesPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Brokers & Settlements
      {
        path: 'brokers',
        element: (
          <PermissionRoute menuCode="BROKERS" action="VIEW">
            <LazyLoad>
              <BrokerListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'brokers/:id',
        element: (
          <PermissionRoute menuCode="BROKERS" action="VIEW">
            <LazyLoad>
              <BrokerDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'settlements',
        element: (
          <PermissionRoute menuCode="BROKERS" action="VIEW">
            <LazyLoad>
              <SettlementListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'settlements/:id',
        element: (
          <PermissionRoute menuCode="BROKERS" action="VIEW">
            <LazyLoad>
              <SettlementDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Inspections & Workshop
      {
        path: 'inspections',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="VIEW">
            <LazyLoad>
              <InspectionListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'inspections/new',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="ADD">
            <LazyLoad>
              <InspectionCreatePage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'inspections/:id',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="VIEW">
            <LazyLoad>
              <InspectionDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'job-cards',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="VIEW">
            <LazyLoad>
              <JobCardListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'job-cards/new',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="ADD">
            <LazyLoad>
              <JobCardCreatePage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'job-cards/:id',
        element: (
          <PermissionRoute menuCode="WORKSHOP" action="VIEW">
            <LazyLoad>
              <JobCardDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Inventory & Suppliers
      {
        path: 'inventory',
        element: (
          <PermissionRoute menuCode="INVENTORY" action="VIEW">
            <LazyLoad>
              <PartsListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'inventory/invoices',
        element: (
          <PermissionRoute menuCode="INVENTORY" action="VIEW">
            <LazyLoad>
              <PurchaseInvoicesPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'inventory/movements',
        element: (
          <PermissionRoute menuCode="INVENTORY" action="VIEW">
            <LazyLoad>
              <StockMovementsPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <PermissionRoute menuCode="INVENTORY" action="VIEW">
            <LazyLoad>
              <SupplierListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Vehicle Costing & Expenses
      {
        path: 'costing',
        element: (
          <PermissionRoute menuCode="COSTING" action="VIEW">
            <LazyLoad>
              <CostingPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Customers
      {
        path: 'customers',
        element: (
          <PermissionRoute menuCode="CUSTOMERS" action="VIEW">
            <LazyLoad>
              <CustomerListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <PermissionRoute menuCode="CUSTOMERS" action="VIEW">
            <LazyLoad>
              <CustomerDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Bookings, Sales & Deliveries
      {
        path: 'bookings',
        element: (
          <PermissionRoute menuCode="SALES" action="VIEW">
            <LazyLoad>
              <BookingListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'sales',
        element: (
          <PermissionRoute menuCode="SALES" action="VIEW">
            <LazyLoad>
              <SalesListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'sales/new',
        element: (
          <PermissionRoute menuCode="SALES" action="ADD">
            <LazyLoad>
              <SaleCreatePage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'sales/:id',
        element: (
          <PermissionRoute menuCode="SALES" action="VIEW">
            <LazyLoad>
              <SaleDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'deliveries',
        element: (
          <PermissionRoute menuCode="SALES" action="VIEW">
            <LazyLoad>
              <DeliveryListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Finance & EMI
      {
        path: 'finance',
        element: (
          <PermissionRoute menuCode="FINANCE" action="VIEW">
            <LazyLoad>
              <FinanceListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'finance/:id',
        element: (
          <PermissionRoute menuCode="FINANCE" action="VIEW">
            <LazyLoad>
              <FinanceDetailPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'documents',
        element: (
          <PermissionRoute menuCode="FINANCE" action="VIEW">
            <LazyLoad>
              <DocumentsPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Service & CRM Follow-ups
      {
        path: 'service',
        element: (
          <PermissionRoute menuCode="SERVICE" action="VIEW">
            <LazyLoad>
              <ServiceDashboardPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'service/new',
        element: (
          <PermissionRoute menuCode="SERVICE" action="ADD">
            <LazyLoad>
              <CreateServiceRecordPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'follow-ups',
        element: (
          <PermissionRoute menuCode="SERVICE" action="VIEW">
            <LazyLoad>
              <FollowUpListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Business Reports
      {
        path: 'reports',
        element: (
          <PermissionRoute menuCode="REPORTS" action="VIEW">
            <LazyLoad>
              <ReportsPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Admin & Security
      {
        path: 'users',
        element: (
          <PermissionRoute menuCode="ADMIN" action="VIEW">
            <LazyLoad>
              <UserListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionRoute menuCode="ADMIN" action="VIEW">
            <LazyLoad>
              <RoleListPage />
            </LazyLoad>
          </PermissionRoute>
        ),
      },

      // Profile & User Preferences
      {
        path: 'profile',
        element: (
          <LazyLoad>
            <ProfilePage />
          </LazyLoad>
        ),
      },
      {
        path: 'change-password',
        element: (
          <LazyLoad>
            <ChangePasswordPage />
          </LazyLoad>
        ),
      },
    ],
  },

  // 404 Catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export default router;
