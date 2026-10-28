# DEALEROS — Cross-Module Dependencies & Data Flows (Document 09)

## 1. Cross-Module Interaction Matrix

| Source Module | Destination Module | Shared Database Entities | Triggering Event / Action | Data Exchanged | Resulting State / Business Effect |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vehicle Procurement** | **Broker Management** | `vehicles`, `broker_vehicle_listings` | Registration of a `BROKER` vehicle | Asking price, commission type, commission rate | Consignment agreement established |
| **Vehicle Inventory** | **Inspection** | `vehicles`, `inspections` | Inspection scheduled | Vehicle ID, Odometer, Reg Number | Vehicle state → `IN_INSPECTION` |
| **Inspection** | **Job Cards** | `inspections`, `job_cards` | Inspection checklist completed | Defect list, repair recommendations | Vehicle state → `IN_REPAIR`; Job Card opened |
| **Job Cards** | **Parts Inventory** | `job_card_items`, `parts`, `stock_movements`| Parts requisitioned during workshop job | Part ID, Quantity used, Unit cost | `parts.current_stock` decremented; movement logged |
| **Purchasing** | **Parts Inventory** | `purchase_invoices`, `parts`, `stock_movements`| "Receive Stock" clicked on purchase bill | Part ID, Quantity received, Unit cost | `parts.current_stock` incremented; movement logged |
| **Purchasing** | **Supplier Accounts** | `purchase_invoices`, `suppliers`, `credit_accounts` | Purchase Invoice recorded | Total amount, Paid amount, Balance | `suppliers.outstanding_balance` incremented |
| **Supplier Payments** | **Purchasing** | `supplier_payments`, `purchase_invoices` | Payment recorded against supplier | Amount, Payment Mode, Ref | Invoice payment status updated; balance reduced |
| **Job Cards & Expenses**| **Costing & Valuation**| `vehicles`, `job_cards`, `shop_expenses` | Job card completed; expense logged | Labor costs, parts cost, outsourced work | Vehicle landed cost updated; base selling price calculated |
| **Vehicle Inventory** | **Sales Execution** | `vehicles`, `sales` | Sale order confirmed (`/sales/new`)| Vehicle ID, Agreed Price, Discount | Vehicle state → `SOLD`; Sale record created |
| **Sales Execution** | **Direct Payments** | `sales`, `payments` | Customer pays upfront at sale | Amount, Method (Cash/UPI/Bank), Ref | Sale balance reduced; payment receipt generated |
| **Sales Execution** | **Finance (In-House)** | `sales`, `finance_details`, `emi_schedules` | Sale executed with `IN_HOUSE_FINANCE` | Down pay, Tenure, ROI, Fee | Loan account created; monthly EMI schedule generated |
| **Sales Execution** | **Finance (External)** | `sales`, `finance_applications`, `lenders` | Sale executed with `EXTERNAL_FINANCE` | Lender ID, App Ref, Requested Loan | External loan file submitted for bank sanction |
| **Sales Execution** | **Broker Settlement** | `sales`, `broker_commissions`, `settlements` | Sale of a `BROKER` vehicle confirmed | Final sale price, workshop repairs | Immutable commission snapshot created; payable balance posted |
| **Sales & Finance** | **Deliveries** | `sales`, `vehicle_deliveries`, `vehicles` | Gatepass issued / delivery confirmed | Handover date, Recipient, Odometer | Vehicle state → `DELIVERED`; customer dossier updated |
| **Sales Execution** | **Service Management** | `customers`, `vehicles`, `services` | Vehicle delivered to customer | Customer ID, Vehicle ID, Delivery date | Baseline service profile established for periodic follow-ups |
| **All Transactions** | **Reports & Analytics** | Aggregated across all tables | Periodic report export (Excel/PDF) | Date range, Branch, Category | Management reporting without affecting transactional data |

---

## 2. Integrity & Concurrency Controls
1. **Preventing Double-Selling**:
   - `VehicleServiceImpl.validateAndTransition()` and `SaleServiceImpl.confirmSale()` enforce that only vehicles in status `READY_FOR_SALE` or `BOOKED` (for the same customer) can be sold.
   - `sales.vehicle_id` has a unique database constraint, preventing duplicate sale orders for the same physical vehicle.
2. **Preventing Negative Stock**:
   - `JobCardServiceImpl` verifies available stock before requisitioning parts.
   - Database column `parts.current_stock` is protected by application validation.
3. **Idempotent Financial Postings**:
   - Payment endpoints require or generate unique idempotency keys (`DOWN-PAY-<saleId>`, `SETTLE-<loanId>-<timestamp>`), preventing double-posting if a user double-clicks submit.
