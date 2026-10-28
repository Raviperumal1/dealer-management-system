# Business Workflows & Operational Lifecycle
## Used Car & Bike Dealership Management System

This document specifies the real-world operational workflows implemented across the system, adhering to the Dealership Software Requirements Document (SRD) and module specifications.

---

## 1. Dual Ownership Model: Fundamental Separation

The system strictly enforces the business and accounting distinction between two ownership models:

### A. Dealership-Owned Vehicle (`OWN`)
- The dealership purchases the vehicle directly from an individual seller or vendor.
- The vehicle is capitalized into dealership inventory assets.
- All refurbishment, parts, and labour incurred are added to the vehicle's cumulative capitalized cost.
- **Financial Calculation:**
  $$\text{Total Vehicle Cost} = \text{Purchase Price} + \text{Purchase Expenses} + \text{Repairs} + \text{Accessories} + \text{Labour} + \text{Other Expenses}$$
  $$\text{Gross Profit} = \text{Customer Selling Price} - \text{Total Vehicle Cost}$$
- **Full Revenue Recognition:** The complete sale price is recognized as dealership sales volume, and the gross profit represents realized dealership income.

### B. Broker-Owned Vehicle (`BROKER`)
- The vehicle is consigned by an independent broker for listing and sale at the showroom.
- The vehicle remains the property of the broker and is **never** added to the dealership's purchased inventory stock.
- **Financial Calculation:**
  $$\text{Gross Commission} = \text{Customer Selling Price} - \text{Broker Settlement Basis (Asking Price)}$$
  $$\text{Net Commission} = \text{Gross Commission} - \text{Shop-Borne Repairs} - \text{Other Shop Expenses}$$
- **Commission-Only Revenue Recognition:** The dealership **never** recognizes the customer sale price (e.g. ₹8,00,000) as dealership sales revenue. Only the earned net commission (e.g. ₹20,000) is recognized as dealership income.
- Upon sale, a **Broker Settlement Record** is automatically generated:
  $$\text{Net Payable to Broker} = \text{Customer Sale Price} - \text{Gross Commission} - \text{Other Deductions} = \text{Broker Agreed Amount}$$

---

## 2. End-to-End Vehicle Lifecycle Workflows

### 2.1 Dealership-Owned Vehicle Lifecycle
```
[PURCHASED] 
    │
    ▼
[INSPECTION] ──────────► (15-Point Check: Engine, Gearbox, Clutch, Tyres, Brakes, AC, etc.)
    │
    ▼
[JOB CARD] ────────────► (Assign tasks, parts consumed, technician labour hours)
    │
    ▼
[REPAIR] ──────────────► (Refurbishment in progress in workshop)
    │
    ▼
[READY_FOR_SALE] ──────► (Quality check cleared, selling price approved)
    │
    ▼
[AVAILABLE] ───────────► (Displayed on showroom floor and online inventory)
    │
    ├──► [BOOKED] ─────► (Customer advance deposit paid; reservation active)
    │        │
    │        ▼
    └──► [SOLD] ───────► (Direct cash/UPI or Finance loan approved; invoice generated)
             │
             ▼
         [DELIVERED] ──► (Delivery checklist, odometer verification, handover)
             │
             ▼
   [SERVICE_FOLLOWUP] ─► (Periodic maintenance reminders, follow-up calls)
```

### 2.2 Broker Consignment Vehicle Lifecycle
```
[BROKER_LISTED] ───────► (Broker details, agreed asking price, commission type: FIXED/PERCENTAGE)
    │
    ▼
[INSPECTION] ──────────► (15-Point Check)
    │
    ▼
[JOB CARD] ────────────► (Cost Responsibility Split: SHOP, BROKER, or SHARED)
    │
    ▼
[READY_FOR_SALE] ──────► (Refurbishment complete, listing price validated)
    │
    ▼
[AVAILABLE] ───────────► (Badged as "BROKER" in inventory)
    │
    ▼
[SOLD] ────────────────► (Sale confirmed; Broker Settlement & Commission records created)
    │
    ▼
[SETTLEMENT_PENDING] ──► (Awaiting payout of broker proceeds)
    │
    ▼
[SETTLED] ─────────────► (Full settlement payment recorded with bank reference)
    │
    ▼
[DELIVERED] ───────────► (Handover to customer completed)
```

---

## 3. Workshop & Inspection Workflow
1. **Inspection Checkpoints (15 Items):**
   - Engine, Gearbox, Clutch, Battery, Tyres, Brakes, Suspension, Air Conditioning, Electrical System, Lights, Body & Panels, Paint Condition, Interior & Upholstery, Steering System, Other / Accessories.
   - Ratings: `GOOD`, `NEED_REPAIR`, `REPLACE`, `NOT_AVAILABLE`.
2. **Job Card Generation:**
   - Automatically references inspection findings.
   - Assigns responsible mechanic / technician.
   - Consumes parts from inventory (decreasing live stock with `JOB_CARD_USAGE` ledger entry).
   - Records labour hours and rates.
3. **Cost Responsibility Split:**
   - `SHOP`: Dealership bears cost (capitalized into Own vehicle, or deducted from broker commission).
   - `BROKER`: Broker bears cost (deducted from broker's final settlement payable).
   - `SHARED`: Percentage or fixed split between dealership and broker.

---

## 4. Inventory, Parts & Suppliers
1. **Suppliers:** Verified contact info and GST number.
2. **Purchase Invoices:** Invoice number, date, itemized parts, quantity, purchase unit price, GST tax.
3. **Automatic Stock Ingestion:** Posting invoice increments part `current_stock` and writes `PURCHASE_IN` ledger entry.
4. **Stock Consumption:** Workshop job cards and after-sales service deplete stock atomically, preventing negative balances.

---

## 5. Sales, Payments & Delivery
1. **Sales Types:**
   - `DIRECT`: Customer pays full amount via Cash, UPI, Bank Transfer, Card, or Cheque.
   - `FINANCE`: Customer pays down payment; balance financed through lending partner.
2. **Idempotent Payments:** Every payment entry supports an optional `idempotency_key` preventing accidental double-deductions during network retry.
3. **Delivery Handover:** Requires verification that payable balance is zero (for Direct sales) or loan is confirmed (for Finance sales), verifies odometer reading, KYC recipient details, and records handover timestamp.

---

## 6. After-Sales Service & Retention
1. **Service Records:** Tracks odometer, customer complaint, technician diagnosis, replacement parts, labour charges, and bill amount.
2. **Automated Reminders:**
   - Next service date and next service kilometre tracking.
   - Categorized as `UPCOMING` (within next 7 days), `DUE` (today), or `OVERDUE` (past target date).
   - Logged customer call outcomes (`CONTACTED`, `APPOINTMENT_BOOKED`, `DECLINED`, `CLOSED`).
