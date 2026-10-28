# DEALEROS — Complete API Reference (Document 07)

## 1. Global API Standards
- **Protocol**: HTTP/1.1 over JSON
- **Base Context Path**: `/api/v1.0`
- **Authentication**: JWT Bearer token in HTTP header `Authorization: Bearer <JWT>`
- **Response Format**: Spring `ResponseEntity<T>` or unified `ApiResponse<T>` / `PageResponse<T>`
- **Date Format**: ISO 8601 Strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)
- **Monetary Format**: Fixed two-decimal precision floating/numbers (`150000.00`)

---

## 2. API Endpoint Inventory Table

| Module | Method | Endpoint URL | Handler Class | Description | Required Role / Perm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | `AuthController.java` | Authenticate user, return JWT and permissions | Public |
| **Auth** | `POST` | `/auth/refresh` | `AuthController.java` | Exchange valid refresh token for new access token | Public |
| **Auth** | `POST` | `/auth/change-password` | `AuthController.java`| Update password for authenticated operator | Authenticated |
| **Vehicles** | `GET` | `/vehicles` | `VehicleController.java` | Paginated vehicle list with filters (status, brand, ownership)| `VEHICLES:VIEW` |
| **Vehicles** | `GET` | `/vehicles/{id}` | `VehicleController.java` | Full vehicle profile, photos, cost metrics, and history | `VEHICLES:VIEW` |
| **Vehicles** | `GET` | `/vehicles/available` | `VehicleController.java` | List vehicles eligible for sale/booking (`READY_FOR_SALE`) | `VEHICLES:VIEW` |
| **Vehicles** | `POST` | `/vehicles` | `VehicleController.java` | Register new procured or broker consignment vehicle | `VEHICLES:ADD` |
| **Vehicles** | `PUT` | `/vehicles/{id}` | `VehicleController.java` | Edit vehicle attributes and pricing | `VEHICLES:EDIT` |
| **Vehicles** | `POST` | `/vehicles/{id}/status` | `VehicleController.java` | State machine transition with audit log reason | `VEHICLES:EDIT` |
| **Vehicles** | `GET` | `/vehicles/purchases` | `VehicleController.java` | Procurement ledger and purchase invoices | `VEHICLES:VIEW` |
| **Inspections**| `GET` | `/inspections` | `InspectionController.java`| Paginated vehicle inspections list | `WORKSHOP:VIEW` |
| **Inspections**| `POST` | `/inspections` | `InspectionController.java`| Record multi-point mechanical inspection | `WORKSHOP:ADD` |
| **Inspections**| `GET` | `/inspections/{id}` | `InspectionController.java`| Inspection checklist detail & repair recommendations | `WORKSHOP:VIEW` |
| **Job Cards** | `GET` | `/job-cards` | `JobCardController.java` | Workshop job cards and reconditioning tasks | `WORKSHOP:VIEW` |
| **Job Cards** | `POST` | `/job-cards` | `JobCardController.java` | Open new job card for internal/broker vehicle | `WORKSHOP:ADD` |
| **Job Cards** | `GET` | `/job-cards/{id}` | `JobCardController.java` | Detailed labor, parts requisition, and cost breakdown | `WORKSHOP:VIEW` |
| **Job Cards** | `POST` | `/job-cards/{id}/complete`| `JobCardController.java` | Mark job card completed and update vehicle status | `WORKSHOP:EDIT` |
| **Parts** | `GET` | `/parts` | `PartController.java` | Spare parts catalog, inventory levels, and reorder alerts | `INVENTORY:VIEW` |
| **Parts** | `POST` | `/parts` | `PartController.java` | Register new spare part item / SKU | `INVENTORY:ADD` |
| **Parts** | `PUT` | `/parts/{id}` | `PartController.java` | Update unit cost, selling price, and min stock | `INVENTORY:EDIT` |
| **Parts** | `GET` | `/parts/{id}/movements` | `PartController.java` | Stock audit ledger (purchases, workshop usage, adjustments) | `INVENTORY:VIEW` |
| **Suppliers** | `GET` | `/suppliers` | `SupplierController.java` | Supplier agencies, GSTIN, and credit account balances | `INVENTORY:VIEW` |
| **Suppliers** | `POST` | `/suppliers` | `SupplierController.java` | Register new parts supplier agency | `INVENTORY:ADD` |
| **Suppliers** | `GET` | `/suppliers/{id}/statement`| `SupplierController.java`| Running statement of account and unpaid bills | `INVENTORY:VIEW` |
| **Suppliers** | `POST` | `/suppliers/payments` | `SupplierController.java` | Record payment against supplier credit balance | `INVENTORY:ADD` |
| **Purchases** | `GET` | `/purchases/invoices` | `PurchaseInvoiceController.java`| List purchase bills and stock receipt statuses | `INVENTORY:VIEW` |
| **Purchases** | `POST` | `/purchases/invoices` | `PurchaseInvoiceController.java`| Record supplier purchase invoice and bill lines | `INVENTORY:ADD` |
| **Purchases** | `POST` | `/purchases/invoices/{id}/receive-stock`| `PurchaseInvoiceController.java`| Material receipt: increments parts stock in inventory | `INVENTORY:EDIT` |
| **Costing** | `GET` | `/vehicles/{id}/cost-breakdown`| `VehicleCostingController.java`| Landed vehicle cost (purchase + parts + labor + expenses)| `INVENTORY:VIEW` |
| **Costing** | `GET` | `/vehicles/costing/summary`| `VehicleCostingController.java`| Dealership fleet valuation and gross margin summary | `INVENTORY:VIEW` |
| **Sales** | `GET` | `/sales` | `SaleController.java` | Paginated sales orders and invoices | `SALES:VIEW` |
| **Sales** | `POST` | `/sales` | `SaleController.java` | Confirm sale contract, snapshot broker comms, set SOLD | `SALES:ADD` |
| **Sales** | `GET` | `/sales/{id}` | `SaleController.java` | Sale contract details, payments ledger, balance due | `SALES:VIEW` |
| **Sales** | `POST` | `/sales/{id}/payments` | `SaleController.java` | Record direct customer payment receipt | `SALES:EDIT` |
| **Deliveries**| `POST` | `/sales/{id}/deliver` | `SaleController.java` | Confirm vehicle delivery and issue gatepass | `SALES:EDIT` |
| **Finance** | `POST` | `/finance/calculate` | `FinanceController.java` | Live compound reducing-balance EMI calculation engine | Public / Permitted |
| **Finance** | `GET` | `/finance` | `FinanceController.java` | Active in-house vehicle loan accounts | `FINANCE:VIEW` |
| **Finance** | `GET` | `/finance/{id}` | `FinanceController.java` | Loan amortization schedule and installment statuses | `FINANCE:VIEW` |
| **Finance** | `POST` | `/finance/emis/{id}/pay` | `FinanceController.java` | Settle individual monthly EMI installment | `FINANCE:EDIT` |
| **Finance** | `GET` | `/finance/overdue` | `FinanceController.java` | Portfolio overdue installment alerts | `FINANCE:VIEW` |
| **Finance** | `GET` | `/finance/{id}/foreclosure-quote`| `FinanceController.java`| Generate early settlement and foreclosure quotation | `FINANCE:VIEW` |
| **Finance** | `POST` | `/finance/{id}/close` | `FinanceController.java` | Settle full loan balance and issue No-Dues closure | `FINANCE:EDIT` |
| **Finance** | `GET` | `/finance/lenders` | `FinanceController.java` | Active partner banks and NBFC financiers | `FINANCE:VIEW` |
| **Finance** | `GET` | `/finance/applications` | `FinanceController.java` | Customer bank loan application files | `FINANCE:VIEW` |
| **Finance** | `POST` | `/finance/applications` | `FinanceController.java` | Submit customer loan file for bank processing | `FINANCE:ADD` |
| **Finance** | `POST` | `/finance/applications/{id}/sanction`| `FinanceController.java`| Record external bank sanction letter and approved terms | `FINANCE:EDIT` |
| **Finance** | `POST` | `/finance/applications/{id}/disburse`| `FinanceController.java`| Record bank funds disbursement to dealership bank | `FINANCE:EDIT` |
| **Finance** | `GET` | `/finance/metrics` | `FinanceController.java` | Finance portfolio metrics (Outstanding, Collections, Arrears)| `FINANCE:VIEW` |
| **Brokers** | `GET` | `/brokers` | `BrokerController.java` | Consignment broker directory and commission structures | `BROKERS:VIEW` |
| **Brokers** | `POST` | `/brokers` | `BrokerController.java` | Register new vehicle sourcing broker | `BROKERS:ADD` |
| **Brokers** | `GET` | `/brokers/{id}/settlement-summary`| `BrokerController.java`| Pending broker payouts and commission ledger | `BROKERS:VIEW` |
| **Customers** | `GET` | `/customers` | `CustomerController.java` | Customer profiles, phone numbers, ID proof | `CUSTOMERS:VIEW` |
| **Customers** | `POST` | `/customers` | `CustomerController.java` | Register customer | `CUSTOMERS:ADD` |
| **Customers** | `GET` | `/customers/{id}` | `CustomerController.java` | Customer dossier with past purchases and active loans | `CUSTOMERS:VIEW` |
| **Services** | `GET` | `/services/history` | `ServiceController.java` | Periodic vehicle service maintenance entries | `SERVICE:VIEW` |
| **Services** | `POST` | `/services/records` | `ServiceController.java` | Record periodic service bill, oil change, inspection | `SERVICE:ADD` |
| **Reports** | `GET` | `/reports/export/{type}`| `ReportController.java` | Generate Excel / PDF reports for Sales, Inventory, Finance | `REPORTS:VIEW` |
| **Users** | `GET` | `/users` | `UserController.java` | Dealership user accounts and assignments | `ROLE_ADMIN` |
| **Users** | `POST` | `/users` | `UserController.java` | Create new staff or manager user account | `ROLE_ADMIN` |
| **Roles** | `GET` | `/roles` | `RoleController.java` | System roles and dynamic permission matrices | `ROLE_ADMIN` |
| **Dashboard** | `GET` | `/dashboard/metrics` | `DashboardController.java`| Key operational showroom metrics | `DASHBOARD:VIEW` |
