# DEALEROS — Authentication & Permissions (Document 11)

## 1. Authentication System
- **Implementation**: Spring Security 6 + JJWT (`0.12.6`).
- **Password Storage**: BCrypt with default strength factor 10 (`BCryptPasswordEncoder`).
- **Session Policy**: Stateless (`SessionCreationPolicy.STATELESS`).
- **Public Endpoints**:
  - `POST /api/v1.0/auth/login` (Returns JWT access token, refresh token, user permissions)
  - `POST /api/v1.0/auth/refresh` (Rotates JWT access token)
  - `POST /api/v1.0/auth/forgot-password`
  - `POST /api/v1.0/auth/reset-password`
  - `POST /api/v1.0/finance/calculate` (Permitted for client-side simulations)
  - `GET /v3/api-docs/**`, `/swagger-ui/**` (OpenAPI documentation)
  - `GET /actuator/health/**`, `/actuator/info` (Monitoring)
  - `GET /documents/**` (Public document streaming for UI image tags)

---

## 2. Dynamic RBAC Permission Matrix

Permissions are structured around `menu_code` with 4 operational flags: `can_view`, `can_add`, `can_edit`, `can_delete`.

| Menu Code | Domain Scope | Default Roles Granted | Supported Actions | Enforcing Controllers |
| :--- | :--- | :--- | :--- | :--- |
| `DASHBOARD` | Executive Overview | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_SALES` | `VIEW` | `DashboardController` |
| `VEHICLES` | Inventory & Purchases Log | `ROLE_ADMIN`, `ROLE_STAFF`, `ROLE_SALES` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `VehicleController` |
| `WORKSHOP` | Inspections & Job Cards | `ROLE_ADMIN`, `ROLE_STAFF` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `InspectionController`, `JobCardController` |
| `INVENTORY` | Parts, Suppliers, Purchase Bills | `ROLE_ADMIN`, `ROLE_STAFF` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `PartController`, `SupplierController`, `PurchaseInvoiceController` |
| `SALES` | Sales Orders, Invoices, Deliveries | `ROLE_ADMIN`, `ROLE_SALES` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `SaleController`, `BookingController` |
| `FINANCE` | In-House Loans, Bank Loans, EMIs | `ROLE_ADMIN`, `ROLE_SALES` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `FinanceController` |
| `BROKERS` | Consignments & Settlements | `ROLE_ADMIN`, `ROLE_STAFF` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `BrokerController`, `SettlementController` |
| `CUSTOMERS`| Customer Dossiers & CRM | `ROLE_ADMIN`, `ROLE_SALES`, `ROLE_STAFF` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `CustomerController` |
| `SERVICE` | Periodic Service Records | `ROLE_ADMIN`, `ROLE_STAFF` | `VIEW`, `ADD`, `EDIT`, `DELETE` | `ServiceController` |
| `REPORTS` | Data Exports (Excel/PDF) | `ROLE_ADMIN`, `ROLE_STAFF` | `VIEW`, `EXPORT` | `ReportController` |
| `SETTINGS` | User Accounts, Roles & Perms | `ROLE_ADMIN` only | Full administrative control | `UserController`, `RoleController`, `PermissionController` |
