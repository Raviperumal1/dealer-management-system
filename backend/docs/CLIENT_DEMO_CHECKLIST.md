# Client Demonstration Checklist & Execution Script
## Used Car & Bike Dealership Management System

This checklist provides the exact 9-stage sequence to follow when demonstrating the system to a dealership owner or prospective enterprise client.

---

## Pre-Demo Checklist
- [x] Backend running on `http://localhost:8081` (`/api/v1.0`).
- [x] MySQL database `dealership_db` connected with seeded baseline data.
- [x] Frontend running on `http://localhost:5173`.
- [x] Test photo files available in a local folder for image upload demonstration.
- [x] Browser session ready with credentials:
  - **Admin:** `admin` / `admin123`
  - **Staff:** `staff` / `StaffSecure@2026!`

---

## 9-Stage Client Demonstration Sequence

### Stage 1: Executive Dashboard & Dealership KPIs
- **Action:** Log in as `admin`. Land on the Executive Dashboard (`/dashboard`).
- **Talking Points:**
  - Emphasize real-time visibility: Total Own vs Broker Inventory, Available Cars vs Bikes, Booked vs Sold units.
  - Show the financial separation: Dealership Owned Gross Profit is distinct from Broker Net Commission.
  - Highlight workshop KPIs (pending job cards, vehicles undergoing refurbishment) and service due reminders.
- **Verification:** Charts render live data without hardcoded values.

### Stage 2: Vehicle Acquisition & Photograph Upload (Own Inventory)
- **Action:** Navigate to **Vehicles** -> **Add Vehicle** (`/vehicles/new`).
- **Steps:**
  1. Select **CAR** -> Type: **OWN Vehicle**.
  2. Enter Brand: `Hyundai`, Model: `Creta SX`, Year: `2022`, Color: `Polar White`.
  3. Enter Reg No: `TN09AB1001`, Odometer: `24,500 km`.
  4. Enter Purchase Price: `₹8,50,000`, Purchase Expenses: `₹15,000`, Seller: `Ramesh Sundaram`.
  5. Submit registration. Navigate to Vehicle Detail page.
  6. In the **Vehicle Photograph Gallery**, click **Upload Photos**.
  7. Select one or more real vehicle JPEG/PNG images.
  8. Verify that the upload completes, image previews render, and the primary badge is set.
  9. **Critical Test:** Refresh the browser; verify images persist and render cleanly.
- **Verification:** Status is `PURCHASED`. Photo persists across page refreshes.

### Stage 3: Inspection, Job Card & Cost Responsibility Split
- **Action:** From Vehicle Detail, click **New 15-Point Inspection**.
- **Steps:**
  1. Inspect checkpoints: mark Engine (`GOOD`), Battery (`REPLACE`), Tyres (`NEED_REPAIR`), Brakes (`GOOD`).
  2. Save inspection.
  3. Click **Create Job Card**:
     - Task 1: Replace battery (Select battery from inventory, e.g. Amaron 12V Battery).
     - Labour: 2 hours @ ₹500/hr = ₹1,000.
     - Select Cost Responsibility: `SHOP` (100% borne by dealership).
  4. Submit Job Card.
  5. Mark Job Card status as `COMPLETED`.
  6. Transition vehicle status: `PURCHASED` -> `INSPECTION` -> `JOB_CARD` -> `READY_FOR_SALE` -> `AVAILABLE`.
- **Verification:** Inventory stock of Battery automatically decreases by 1 unit. Vehicle Cost updates with purchase + repairs + labour.

### Stage 4: Sell an Owned Vehicle & Financial Costing Reconciliation
- **Action:** Navigate to **Sales** -> **New Sale** (`/sales/new`).
- **Steps:**
  1. Select Customer (or create new: `Anand Sharma`, `+91 9840123456`).
  2. Select vehicle `TN09AB1001` (Hyundai Creta).
  3. Sale Type: `DIRECT`.
  4. Agreed Price: `₹10,50,000`, Discount: `₹10,000`, Final Sale Price: `₹10,40,000`.
  5. Confirm sale. Vehicle status automatically transitions to `SOLD`.
  6. Click **Record Payment**: Pay ₹10,40,000 via `BANK_TRANSFER` (Ref: `HDFC-TXN-88392`).
  7. Complete **Delivery Handover** (Recipient: Anand Sharma, Odometer: 24,510 km). Status becomes `DELIVERED`.
  8. Open **Costing & Profitability** (`/costing`):
     - Show: Sale Price (`₹10,40,000`) - Total Cost (`₹8,70,500`) = **Realized Gross Profit (`₹1,69,500`)**.
- **Verification:** Profit is accurately calculated and verified from database transaction records.

### Stage 5: Broker Vehicle Consignment, Sale & Settlement
- **Action:** Navigate to **Brokers** (`/brokers`).
- **Steps:**
  1. Create or select Broker (e.g. `Rajesh Auto Consultants`, `+91 9884011223`).
  2. Click **List Consignment Vehicle**:
     - Vehicle: `Kia Seltos HTX` (`TN07CD4567`).
     - Broker Asking / Settlement Basis: `₹7,50,000`.
     - Expected Selling Price: `₹7,80,000`.
     - Commission: `FIXED` ₹30,000 (or `PERCENTAGE`).
  3. Verify vehicle appears in inventory with **BROKER** badge.
  4. Transition through Inspection -> Ready for Sale -> Available.
  5. Confirm Sale of Broker Vehicle for `₹7,80,000`.
  6. Navigate to **Brokers & Settlements** (`/settlements`):
     - Show Settlement Record: Sale Amount `₹7,80,000`, Broker Amount `₹7,50,000`, Dealership Commission `₹30,000`, Net Payable to Broker `₹7,50,000`.
     - Show that the dealership recognizes **only ₹30,000** as revenue, not ₹7,80,000!
  7. Record partial settlement payment of `₹5,00,000` via NEFT -> Status becomes `PARTIALLY_PAID`.
  8. Record remaining payment of `₹2,50,000` -> Status becomes `PAID`.
- **Verification:** Full reconciliation without counting vehicle as dealership stock.

### Stage 6: Parts Supplier, Purchase Invoice & Stock Ingestion
- **Action:** Navigate to **Parts & Inventory** (`/inventory/parts`).
- **Steps:**
  1. Show current stock of Bosch Brake Pads (e.g. 15 sets).
  2. Go to **Purchase Invoices** -> **New Invoice**:
     - Supplier: `Apex Auto Spares Pvt Ltd`.
     - Invoice No: `INV-2026-901`.
     - Add 10 sets of Brake Pads @ ₹1,500 each.
     - Post invoice.
  3. Return to Parts list: Stock automatically incremented to 25 sets.
  4. View **Stock Movements Ledger**: Shows audit record `PURCHASE_IN` (+10).
- **Verification:** Real-time atomic stock update.

### Stage 7: Vehicle Financing, EMI Schedule & Reports
- **Action:** Open a Finance Sale or navigate to **Finance & EMI** (`/finance`).
- **Steps:**
  1. Review Finance Details: Loan Amount ₹6,00,000, 36 months, 9.5% interest, EMI ₹19,219.
  2. View Amortization Schedule (36 installments with Principal, Interest, Due Date).
  3. Mark Installment #1 as **PAID**.
  4. Navigate to **Reports & Analytics** (`/reports`):
     - View Profit Report: separate Own vehicle profit vs Broker net commission.
     - Export to CSV / PDF.
- **Verification:** All reports reconcile with ledger entries.

### Stage 8: Role-Based Access Control (Admin vs Staff)
- **Action:**
  1. Log out as Admin. Log in as `staff` (`StaffSecure@2026!`).
  2. Observe Sidebar: **Users & Roles** and **Reports** menus are hidden.
  3. Attempting to navigate directly to `/admin` or `/reports` is blocked by Permission Guard.
  4. Staff can view inventory, create inspections, and log service records according to slide 15 permission matrix.
- **Verification:** Security boundary enforced both in UI and backend API.

### Stage 9: Validation, Concurrency & Failure Handling
- **Action:**
  1. Attempt to register vehicle with an already existing Registration Number -> Displays clean user-friendly validation error.
  2. Attempt invalid state transition (e.g. `PURCHASED` directly to `DELIVERED`) -> Blocked by backend workflow service.
  3. Attempt to mark delivery for an unpaid Direct sale -> Blocked until payment is confirmed.
- **Verification:** System never corrupts business state on invalid inputs.
