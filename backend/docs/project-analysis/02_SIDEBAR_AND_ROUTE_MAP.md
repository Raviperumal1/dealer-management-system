# DEALEROS — Sidebar & Route Map (Document 02)

## 1. Sidebar Architecture & Behavior

The main sidebar component is implemented in [`Sidebar.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/components/layout/Sidebar.jsx). It features:
- **Brand Header**: Dealeros logo icon (`<Car size={20} />`) with brand title `DEALEROS` and subtitle `DMS ENTERPRISE`.
- **Collapse / Expand Toggle**: Desktop collapsible toggle button with chevron indicator storing state in Redux `uiSlice.sidebarCollapsed`.
- **Responsive Mobile Drawer**: Off-canvas transition controlled by Redux `uiSlice.mobileSidebarOpen`.
- **Permission & Role Security**: Every navigation group and item checks `isAdmin || hasPermission(MENU_CODE, 'VIEW')` before rendering.
- **Active Route Highlighting**: Uses `NavLink` with active subnav dots and parent highlight classes (`active-parent`).
- **Auto-Expansion**: Automatically opens submenus on direct URL load matching `/vehicles`, `/inventory`, `/finance`, or `/users`.
- **User Footer**: Displays current authenticated operator's initial, full name, and primary role badge.

---

## 2. Complete Navigation & Route Inventory Table

| Menu Group | Menu Item Label | Parent Menu | Exact Route Path | Page Component | Permission / Role | Backend Dependencies | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Workspace** | Dashboard | Root | `/dashboard` | `DashboardPage.jsx` | `DASHBOARD:VIEW` | `/dashboard/metrics`, `/dashboard/sales-trend`, `/dashboard/inventory-summary` | Complete & Verified |
| **Workspace** | Vehicles | Root (Group) | — | Collapsible Menu | `VEHICLES:VIEW` | None (UI Group) | Complete & Verified |
| Vehicles | All Inventory | Vehicles | `/vehicles` | `VehicleListPage.jsx` | `VEHICLES:VIEW` | `/vehicles?page=X&size=Y` | Complete & Verified |
| Vehicles | Own Vehicles | Vehicles | `/vehicles?ownership=OWN` | `VehicleListPage.jsx` | `VEHICLES:VIEW` | `/vehicles?ownership=OWN` | Complete & Verified |
| Vehicles | Broker Vehicles | Vehicles | `/vehicles?ownership=BROKER` | `VehicleListPage.jsx` | `VEHICLES:VIEW` | `/vehicles?ownership=BROKER` | Complete & Verified |
| Vehicles | Available Stock | Vehicles | `/vehicles/available` | `AvailableVehiclesPage.jsx`| `VEHICLES:VIEW` | `/vehicles/available` | Complete & Verified |
| Vehicles | Purchases Log | Vehicles | `/purchases` | `PurchasesPage.jsx` | `VEHICLES:VIEW` | `/vehicles/purchases` | Complete & Verified |
| **Operations**| Inspection | Root | `/inspections` | `InspectionListPage.jsx` | `WORKSHOP:VIEW` | `/inspections` | Complete & Verified |
| Inspection | New Inspection | Subpage | `/inspections/new` | `InspectionCreatePage.jsx`| `WORKSHOP:ADD` | `/inspections`, `/vehicles/available` | Complete & Verified |
| Inspection | Inspection Details | Subpage | `/inspections/:id` | `InspectionDetailPage.jsx`| `WORKSHOP:VIEW` | `/inspections/{id}` | Complete & Verified |
| **Operations**| Job Cards | Root | `/job-cards` | `JobCardListPage.jsx` | `WORKSHOP:VIEW` | `/job-cards` | Complete & Verified |
| Job Cards | Create Job Card | Subpage | `/job-cards/new` | `JobCardCreatePage.jsx` | `WORKSHOP:ADD` | `/job-cards`, `/inventory/parts` | Complete & Verified |
| Job Cards | Job Card Details | Subpage | `/job-cards/:id` | `JobCardDetailPage.jsx` | `WORKSHOP:VIEW` | `/job-cards/{id}` | Complete & Verified |
| **Operations**| Inventory & Purchases | Root (Group) | — | Collapsible Menu | `INVENTORY:VIEW` | None (UI Group) | Complete & Verified |
| Inventory | 1. Spare Parts Inventory | Inventory | `/inventory` | `PartsListPage.jsx` | `INVENTORY:VIEW` | `/parts` | Complete & Verified |
| Inventory | 2. Suppliers / Parts Agencies | Inventory | `/suppliers` | `SupplierListPage.jsx` | `INVENTORY:VIEW` | `/suppliers` | Complete & Verified |
| Inventory | 3. Purchase Orders & Bills | Inventory | `/inventory/invoices` | `PurchaseInvoicesPage.jsx`| `INVENTORY:VIEW` | `/purchases/invoices` | Complete & Verified |
| Inventory | 4. Supplier Payments | Inventory | `/suppliers?tab=payments` | `SupplierListPage.jsx` | `INVENTORY:VIEW` | `/suppliers/payments` | Complete & Verified |
| Inventory | 5. Supplier Credit Accounts | Inventory | `/suppliers?tab=ledger` | `SupplierListPage.jsx` | `INVENTORY:VIEW` | `/suppliers/{id}/statement` | Complete & Verified |
| Inventory | 6. Vehicle Repair Costs | Inventory | `/costing?tab=repairs` | `CostingPage.jsx` | `INVENTORY:VIEW` | `/vehicles/{id}/cost-breakdown` | Complete & Verified |
| Inventory | 7. Vehicle Costing & Profitability | Inventory | `/costing` | `CostingPage.jsx` | `INVENTORY:VIEW` | `/vehicles/{id}/cost-breakdown` | Complete & Verified |
| Inventory | 8. Stock Movements | Inventory | `/inventory/movements` | `StockMovementsPage.jsx` | `INVENTORY:VIEW` | `/parts/{id}/movements` | Complete & Verified |
| Inventory | 9. Inventory Reports | Inventory | `/reports?tab=inventory` | `ReportsPage.jsx` | `INVENTORY:VIEW` | `/reports/inventory` | Complete & Verified |
| **Commercial**| Sales | Root | `/sales` | `SalesListPage.jsx` | `SALES:VIEW` | `/sales` | Complete & Verified |
| Sales | Execute Sale Order | Subpage | `/sales/new` | `SaleCreatePage.jsx` | `SALES:ADD` | `/sales`, `/finance/calculate` | Complete & Verified |
| Sales | Sale Order Details | Subpage | `/sales/:id` | `SaleDetailPage.jsx` | `SALES:VIEW` | `/sales/{id}`, `/sales/{id}/payments` | Complete & Verified |
| Sales | Deliveries & Gatepass | Subpage | `/deliveries` | `DeliveryListPage.jsx` | `SALES:VIEW` | `/deliveries` | Complete & Verified |
| **Commercial**| Finance & Loans | Root (Group) | — | Collapsible Menu | `FINANCE:VIEW` | None (UI Group) | Complete & Verified |
| Finance | Finance Dashboard | Finance | `/finance?tab=overview` | `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance/metrics` | Complete & Verified |
| Finance | In-House Loans | Finance | `/finance?tab=in-house` | `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance` | Complete & Verified |
| Finance | Bank / NBFC Loans | Finance | `/finance?tab=applications`| `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance/applications` | Complete & Verified |
| Finance | Overdue Accounts | Finance | `/finance?tab=overdue` | `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance/overdue` | Complete & Verified |
| Finance | Lenders & Partners | Finance | `/finance?tab=lenders` | `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance/lenders` | Complete & Verified |
| Finance | EMI Calculator | Finance | `/finance?tab=calculator` | `FinanceListPage.jsx` | `FINANCE:VIEW` | `/finance/calculate` | Complete & Verified |
| Finance | Loan Amortization & Closure| Subpage | `/finance/:id` | `FinanceDetailPage.jsx` | `FINANCE:VIEW` | `/finance/{id}`, `/finance/{id}/close` | Complete & Verified |
| **Commercial**| Brokers | Root | `/brokers` | `BrokerListPage.jsx` | `BROKERS:VIEW` | `/brokers` | Complete & Verified |
| Brokers | Broker Ledger & Details | Subpage | `/brokers/:id` | `BrokerDetailPage.jsx` | `BROKERS:VIEW` | `/brokers/{id}`, `/settlements` | Complete & Verified |
| **Commercial**| Customers | Root | `/customers` | `CustomerListPage.jsx` | `CUSTOMERS:VIEW` | `/customers` | Complete & Verified |
| Customers | Customer Dossier | Subpage | `/customers/:id` | `CustomerDetailPage.jsx`| `CUSTOMERS:VIEW` | `/customers/{id}` | Complete & Verified |
| **Operations**| Service | Root | `/service` | `ServiceDashboardPage.jsx`| `SERVICE:VIEW` | `/services/history` | Complete & Verified |
| Service | Record Service Entry | Subpage | `/service/new` | `CreateServiceRecordPage.jsx`| `SERVICE:ADD` | `/services/records` | Complete & Verified |
| Service | Service Follow-Ups | Subpage | `/service/followups` | `FollowUpListPage.jsx` | `SERVICE:VIEW` | `/services/follow-ups` | Complete & Verified |
| **Analytics** | Reports | Root | `/reports` | `ReportsPage.jsx` | `REPORTS:VIEW` | `/reports/export/*` | Complete & Verified |
| **Settings** | User Accounts | Settings (Group)| `/users` | `UserListPage.jsx` | `ADMIN` only | `/users` | Complete & Verified |
| **Settings** | Roles & Permissions | Settings (Group)| `/roles` | `RoleListPage.jsx` | `ADMIN` only | `/roles`, `/permissions` | Complete & Verified |
| **User Profile**| Operator Profile | Header / Avatar | `/profile` | `ProfilePage.jsx` | Authenticated user | `/users/me` | Complete & Verified |
| **User Profile**| Change Password | Header Dropdown | `/change-password` | `ChangePasswordPage.jsx`| Authenticated user | `/auth/change-password` | Complete & Verified |

---

## 3. Route Guard & Protection Hierarchy

All application routes are shielded inside [`AppRoutes.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/app/router.jsx):
1. **`PublicRoute`**: Accessible only when unauthenticated. If JWT is present, automatically redirects to `/dashboard`.
2. **`ProtectedRoute`**: Rejects unauthenticated traffic and redirects to `/login` preserving the attempted destination in `location.state`.
3. **`PermissionRoute`**: Validates the authenticated user's permissions array:
   ```javascript
   if (isAdmin) return children;
   const allowed = user?.permissions?.some(p => p.menuCode === menuCode && p[action.toLowerCase()]);
   return allowed ? children : <AccessDeniedPage />;
   ```
4. **`RouteErrorBoundary`**: Catches unhandled runtime exceptions at route boundaries without crashing the application frame.
