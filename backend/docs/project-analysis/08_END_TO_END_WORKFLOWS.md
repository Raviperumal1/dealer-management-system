# DEALEROS — End-to-End User Workflows (Document 08)

## Workflow 1: Vehicle Procurement & Inventory Registration
1. **User Action**: Operator navigates to **Vehicles** → **New Vehicle** (`/vehicles/new`).
2. **Form Input**:
   - Vehicle Type (`CAR` / `TWO_WHEELER`), Ownership (`OWN` vs `BROKER`).
   - Registration Number (e.g. `MH12AB1234`), Brand, Model, Manufacturing Year.
   - If `OWN`: Purchase Price, Procurement Vendor, Date.
   - If `BROKER`: Sourcing Broker, Broker Asking Price, Commission Agreement (Fixed ₹ or % of Sale Price).
3. **Execution**: React submits to `POST /api/v1.0/vehicles`.
4. **Backend Processing**:
   - `VehicleServiceImpl.createVehicle()` validates uniqueness of Registration Number and Chassis/VIN.
   - If broker vehicle, creates associated `BrokerVehicleListingEntity`.
   - Sets initial status to `PROCURED`.
5. **Persistence**: Saved to `vehicles` and `broker_vehicle_listings` in a single `@Transactional` boundary.
6. **Result**: Vehicle appears on `/vehicles` list and is marked as awaiting workshop inspection.

---

## Workflow 2: Workshop Reconditioning & Cost Aggregation
1. **User Action**: Workshop manager opens **Inspection** → **New Inspection** (`/inspections/new`) for vehicle.
2. **Inspection**: Checks 50+ mechanical/body checkpoints. Submits checklist.
3. **Vehicle Transition**: State transitions from `PROCURED` to `IN_INSPECTION` then `IN_REPAIR`.
4. **Job Card Creation**: Operator opens `/job-cards/new`, specifies required tasks, labor charges, and requisitions spare parts from inventory.
5. **Stock Deduction**: Upon job card execution, required parts quantities are decremented from `parts.current_stock` and logged to `part_stock_movements`.
6. **Job Completion**: Job Card marked completed. Vehicle automatically transitions to `READY_FOR_SALE`.
7. **Cost Aggregation**: `VehicleCostingServiceImpl.getCostBreakdown(id)` computes:
   $$\text{Total Vehicle Investment} = \text{Purchase Price} + \text{Internal Workshop Cost} + \text{Parts Consumed} + \text{Shop Overheads}$$

---

## Workflow 3: Spare Parts Purchasing & Supplier Credit Accounts
1. **User Action**: Operator navigates to **Inventory & Purchases** → **Purchase Orders & Bills** (`/inventory/invoices`).
2. **Recording Purchase**:
   - Selects supplier agency (e.g. "Bosch Auto Spares").
   - Enters Invoice Number, Bill Date, Due Date.
   - Adds bill line items: selects part, quantity, unit purchase price, tax rate (GST).
   - Enters upfront payment made (or 0 for full credit purchase).
3. **Backend Processing**:
   - `PurchaseInvoiceServiceImpl.createInvoice()` calculates subtotal, GST, and balance due.
   - Adds line items and updates `suppliers.outstanding_balance` and `supplier_credit_accounts`.
4. **Stock Receipt**: Operator clicks **Receive Stock**:
   - System increments `current_stock` for each part.
   - Logs `PURCHASE_RECEIPT` into `part_stock_movements`.
   - Updates `stock_receipt_status = RECEIVED`.
5. **Supplier Payment**: Operator opens `/suppliers?tab=payments` to record NEFT/Cheque payment. System debits supplier credit account and updates invoice payment status (`UNPAID` → `PARTIALLY_PAID` → `PAID`).

---

## Workflow 4: Vehicle Sale Execution (3 Distinct Payment Methods)
1. **User Action**: Sales manager opens `/sales/new`, selects vehicle (`READY_FOR_SALE`) and customer.
2. **Agreed Commercial Terms**: System loads vehicle base price + workshop repair investment. Operator enters agreed price, special discount, and trade-in exchange allowance.
3. **Payment Method Selection**:
   - **Method A — Direct Payment**:
     - Operator enters initial payment received (Cash, UPI, Cheque, NEFT).
     - System calculates balance due:
       $$\text{Balance Due} = \text{Agreed Price} - \text{Discount} - \text{Initial Payment} - \text{Trade-In}$$
     - If balance is 0, sale is marked `COMPLETED`; otherwise `CONFIRMED`.
   - **Method B — DEALEROS In-House EMI Financing**:
     - Operator enters customer down payment, tenure (e.g. 36 months), annual interest rate (e.g. 10.5%), and optional loan processing fee.
     - Live compound reducing-balance EMI engine computes monthly installment.
     - Creates `FinanceDetailEntity` and 36 individual monthly rows in `EmiScheduleEntity`.
   - **Method C — External Bank / NBFC Finance**:
     - Operator selects financing partner (e.g. HDFC Bank, ICICI Bank), enters loan application reference number, requested loan amount, and customer margin money.
     - System creates a linked `FinanceApplicationEntity` under `SUBMITTED` status.
4. **Broker Settlement Snapshot (If Consignment Stock)**:
   - System calculates broker gross commission.
   - Deducts broker-borne repair costs and shop expenses.
   - Creates immutable snapshot in `broker_commissions` and creates payable obligation in `broker_settlements`.
5. **Vehicle State Machine**: Vehicle transitions atomically to `SOLD`.

---

## Workflow 5: In-House EMI Collection, Prepayment & Foreclosure
1. **Monthly Collection**: Customer visits showroom or pays via UPI. Operator navigates to `/finance/{id}`, views monthly schedule, and clicks **Settle EMI**. Installment is marked `PAID`, receipt reference logged, and `principal_outstanding` reduced.
2. **Overdue Alerts**: If an installment passes its `due_date` without payment, `/finance?tab=overdue` highlights account with days overdue and pending arrears.
3. **Early Foreclosure & Closure**:
   - Customer requests full early settlement. Operator clicks **Foreclosure & Close Loan**.
   - `GET /finance/{id}/foreclosure-quote` generates real-time settlement quote:
     $$\text{Settlement Total} = \text{Principal Outstanding} + \text{Accrued Interest} + \text{Foreclosure Fee (2\%)} + \text{Overdue Arrears}$$
   - Customer pays via Bank Transfer/NEFT. Operator inputs bank UTR reference.
   - `POST /finance/{id}/close` updates loan status to `CLOSED`, clears pending schedule records, and issues No-Dues clearance.

---

## Workflow 6: Vehicle Delivery & Gatepass Issuance
1. **Eligibility Check**: Operator navigates to `/deliveries` or sale detail page `/sales/{id}`.
2. **Delivery Verification**:
   - If direct sale: enforces full payment settlement (`balanceDue <= 0`).
   - If in-house loan: verifies executed finance contract and down payment receipt.
   - If external bank loan: verifies lender disbursement received or authorized manager release.
3. **Execution**: Operator enters recipient name, phone, delivery date, odometer reading at handover, and checklist items (spare keys, owner's manual, toolkit).
4. **Result**: Vehicle transitions to `DELIVERED`, gatepass is generated, and customer service dossier is created.
