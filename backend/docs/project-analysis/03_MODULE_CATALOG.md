# DEALEROS — Complete Module Catalog (Document 03)

## 1. Module Overview Summary
DEALEROS consists of 14 integrated functional modules, structured into 20+ specialized backend controllers and 22 frontend feature folders.

---

## 2. Detailed Module Breakdown

### 2.1 Dashboard & Executive Analytics
- **Business Purpose**: Real-time cockpit displaying inventory health, available vehicle count, sales revenue this month, total workshop repair investment, upcoming service appointments, and portfolio finance status.
- **Frontend Files**: [`DashboardPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/dashboard/DashboardPage.jsx)
- **Backend Files**: [`DashboardController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/dashboard/DashboardController.java), `DashboardServiceImpl.java`
- **Database Entities**: Aggregates from `vehicles`, `sales`, `job_cards`, `finance_details`, `services`.
- **Completeness**: **Complete & Verified**.

### 2.2 Vehicle Inventory & Acquisition
- **Business Purpose**: Manages full vehicle lifecycle from procurement to disposal. Distinguishes direct ownership (`OWN`) from consignment broker agreements (`BROKER`). Tracks engine/chassis numbers, RTO registration, fuel type, odometer, purchase cost, and selling price.
- **Frontend Files**: [`VehicleListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/vehicles/VehicleListPage.jsx), [`AvailableVehiclesPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/vehicles/AvailableVehiclesPage.jsx), [`VehicleDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/vehicles/VehicleDetailPage.jsx), [`VehicleFormPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/vehicles/VehicleFormPage.jsx)
- **Backend Files**: [`VehicleController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/vehicle/VehicleController.java), [`VehicleServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/vehicle/VehicleServiceImpl.java)
- **Database Entities**: `vehicles`, `vehicle_photos`, `vehicle_documents`, `vehicle_purchase_records`
- **State Machine Transitions**:
  `PROCURED` → `IN_INSPECTION` → `IN_REPAIR` → `READY_FOR_SALE` → `BOOKED` → `SOLD` → `DELIVERED`.
- **Completeness**: **Complete & Verified**.

### 2.3 Workshop Inspections
- **Business Purpose**: Multi-point mechanical, electrical, body, and tire condition assessment. Produces repair recommendations and feeds directly into Job Card creation.
- **Frontend Files**: [`InspectionListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inspections/InspectionListPage.jsx), [`InspectionCreatePage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inspections/InspectionCreatePage.jsx), [`InspectionDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inspections/InspectionDetailPage.jsx)
- **Backend Files**: [`InspectionController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/inspection/InspectionController.java), `InspectionServiceImpl.java`
- **Database Entities**: `inspections`, `inspection_checkpoints`
- **Completeness**: **Complete & Verified**.

### 2.4 Workshop Job Cards & Reconditioning
- **Business Purpose**: Tracks internal dealership and third-party vendor repair tasks, labor hours, technician assignment, and spare parts requisition. Accurately segregates costs borne by the dealership vs broker deductions.
- **Frontend Files**: [`JobCardListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/jobCards/JobCardListPage.jsx), [`JobCardCreatePage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/jobCards/JobCardCreatePage.jsx), [`JobCardDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/jobCards/JobCardDetailPage.jsx)
- **Backend Files**: [`JobCardController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/jobcard/JobCardController.java), `JobCardServiceImpl.java`
- **Database Entities**: `job_cards`, `job_card_items`, `job_card_labor`
- **Completeness**: **Complete & Verified**.

### 2.5 Inventory & Purchasing (Parts & Suppliers)
- **Business Purpose**: Replaces manual ledger tracking with an enterprise inventory purchasing module:
  1. **Suppliers**: Agency profile, GSTIN, credit limits, contact persons.
  2. **Spare Parts**: SKU tracking, min/max reorder levels, unit cost, available stock.
  3. **Purchase Orders & Invoices**: Itemized bills, GST tax breakdown, direct stock increment.
  4. **Payments & Supplier Ledger**: Multi-bill payments, running credit balance, statement of accounts.
- **Frontend Files**: [`PartsListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inventory/PartsListPage.jsx), [`SupplierListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/suppliers/SupplierListPage.jsx), [`PurchaseInvoicesPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inventory/PurchaseInvoicesPage.jsx), [`StockMovementsPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/inventory/StockMovementsPage.jsx)
- **Backend Files**: [`PartController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/inventory/PartController.java), [`SupplierController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/supplier/SupplierController.java), [`PurchaseInvoiceController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/inventory/PurchaseInvoiceController.java)
- **Database Entities**: `suppliers`, `supplier_credit_accounts`, `parts`, `purchase_invoices`, `purchase_invoice_items`, `supplier_payments`, `part_stock_movements`
- **Completeness**: **Complete & Verified**.

### 2.6 Vehicle Costing & Profitability
- **Business Purpose**: Aggregates acquisition cost + shop repairs + outsourced repairs + parts consumption + shop overheads to compute true vehicle landed cost, minimum viable selling price, and real gross margin upon sale.
- **Frontend Files**: [`CostingPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/costing/CostingPage.jsx)
- **Backend Files**: [`VehicleCostingController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/costing/VehicleCostingController.java), `VehicleCostingServiceImpl.java`
- **Database Entities**: Aggregates `vehicles`, `job_cards`, `shop_expenses`, `sales`
- **Completeness**: **Complete & Verified**.

### 2.7 Sales & Vehicle Deliveries
- **Business Purpose**: Finalizes vehicle sale agreement with token/full payment realization, broker settlement snapshots, delivery gatepass generation, and customer invoice generation.
- **Frontend Files**: [`SalesListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/sales/SalesListPage.jsx), [`SaleCreatePage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/sales/SaleCreatePage.jsx), [`SaleDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/sales/SaleDetailPage.jsx), [`DeliveryListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/deliveries/DeliveryListPage.jsx)
- **Backend Files**: [`SaleController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/sales/SaleController.java), [`SaleServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/sales/SaleServiceImpl.java)
- **Database Entities**: `sales`, `payments`, `vehicle_deliveries`, `broker_commissions`, `broker_settlements`
- **Completeness**: **Complete & Verified**.

### 2.8 Automotive Finance & Loan Management
- **Business Purpose**: Comprehensive multi-channel vehicle finance engine supporting 3 distinct methods:
  1. Direct payment settlement.
  2. DEALEROS in-house monthly reducing-balance EMI loan portfolio with prepayment & foreclosure settlement quotes.
  3. External Bank / NBFC financing (HDFC, ICICI, SBI, Bajaj, Mahindra) tracking sanction letters and actual dealer bank disbursements.
- **Frontend Files**: [`FinanceListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/finance/FinanceListPage.jsx), [`FinanceDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/finance/FinanceDetailPage.jsx)
- **Backend Files**: [`FinanceController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/finance/FinanceController.java), [`FinanceServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/finance/FinanceServiceImpl.java)
- **Database Entities**: `finance_details`, `emi_schedules`, `finance_lenders`, `finance_applications`
- **Completeness**: **Complete & Verified**.

### 2.9 Consignment Brokers & Settlement Ledger
- **Business Purpose**: Tracks automotive brokers supplying third-party consignment stock. Automatically snapshots agreed asking price, calculates fixed or percentage commission upon sale, deducts broker-funded repairs, and produces settlement balances.
- **Frontend Files**: [`BrokerListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/brokers/BrokerListPage.jsx), [`BrokerDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/brokers/BrokerDetailPage.jsx), [`SettlementListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/settlements/SettlementListPage.jsx), [`SettlementDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/settlements/SettlementDetailPage.jsx)
- **Backend Files**: [`BrokerController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/broker/BrokerController.java), [`SettlementController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/settlement/SettlementController.java)
- **Database Entities**: `brokers`, `broker_vehicle_listings`, `broker_commissions`, `broker_settlements`, `broker_payments`
- **Completeness**: **Complete & Verified**.

### 2.10 Customer Relationship Management (CRM)
- **Business Purpose**: Central repository of customer legal identity (PAN, Aadhaar), phone contacts, purchase history, active loans, and scheduled service follow-ups.
- **Frontend Files**: [`CustomerListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/customers/CustomerListPage.jsx), [`CustomerDetailPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/customers/CustomerDetailPage.jsx)
- **Backend Files**: [`CustomerController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/customer/CustomerController.java)
- **Database Entities**: `customers`, `customer_documents`
- **Completeness**: **Complete & Verified**.

### 2.11 Customer Service & Post-Sale Maintenance
- **Business Purpose**: Tracks periodic servicing, customer complaints, service history records, and automated service reminder follow-ups.
- **Frontend Files**: [`ServiceDashboardPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/services/ServiceDashboardPage.jsx), [`CreateServiceRecordPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/services/CreateServiceRecordPage.jsx), [`FollowUpListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/followups/FollowUpListPage.jsx)
- **Backend Files**: [`ServiceController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/service/ServiceController.java)
- **Database Entities**: `services`, `service_items`, `service_follow_ups`
- **Completeness**: **Complete & Verified**.

### 2.12 Reporting & Data Exports
- **Business Purpose**: Comprehensive data exports to Excel (`.xlsx`) via Apache POI and PDF via OpenPDF across Sales, Inventory, Workshop, Finance, and Supplier Accounts.
- **Frontend Files**: [`ReportsPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/reports/ReportsPage.jsx)
- **Backend Files**: [`ReportController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/reports/ReportController.java)
- **Completeness**: **Complete & Verified**.

### 2.13 User Management, Roles & Dynamic Permissions
- **Business Purpose**: Granular Role-Based Access Control (RBAC). Admin can configure roles and toggles for `VIEW`, `ADD`, `EDIT`, `DELETE` per menu code.
- **Frontend Files**: [`UserListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/users/UserListPage.jsx), [`RoleListPage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/roles/RoleListPage.jsx)
- **Backend Files**: [`UserController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/user/UserController.java), [`RoleController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/role/RoleController.java), [`PermissionController.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/controller/permission/PermissionController.java)
- **Database Entities**: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- **Completeness**: **Complete & Verified**.
