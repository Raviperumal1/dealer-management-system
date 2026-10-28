# DEALEROS — Business Workflow Specification (Document 02)

## 1. End-to-End Vehicle Lifecycle

```
[Procurement / Purchase / Broker Listing]
                   │
                   ▼
       [Multi-Point Inspection]
         │                  │
         │ (Passed)         │ (Needs Attention / Replace)
         ▼                  ▼
  [Inventory Stock]    [Workshop Job Card Created]
         │                  │
         │                  ├─ Estimate Prepared
         │                  ├─ Estimate Approved
         │                  ├─ Parts Issued via Stock Ledger
         │                  ├─ Labour Operations Logged
         │                  └─ Quality Check & Financial Closure (COMPLETED / CLOSED)
         │                                  │
         │◄─────────────────────────────────┘ (Costs Capitalized to Dealer Inventory)
         │
         ▼
[Authoritative Costing Engine]
   ├─ Landed Acquisition Cost
   ├─ Capitalized Refurbishment Costs
   ├─ Authoritative Price Recommendations (Target Margin % vs Markup %)
   └─ Sales Floor Price Safeguards
         │
         ▼
[Vehicle Ready for Sale & Availability Guardrails]
   (Enforced: No active job cards & all inspection items clear)
         │
         ▼
[Customer Sales & Invoicing Workflow]
   ├─ Customer Registration & Verification
   ├─ Booking Advance Conversion
   ├─ Mode Selection (Direct Sale vs Finance Sale)
   ├─ In-House or Bank Loan Processing (Amortization Schedule Generated)
   └─ Delivery & Document Handover
         │
         ▼
[Financial Settlement & After-Sales Follow-Up]
   ├─ Installment Collections & Idempotent Receipts
   ├─ Overdue Tracking & Foreclosure Settlement
   └─ Periodic Maintenance & Service Record Management
```

---

## 2. Formal Financial Costing Formulas

### A. Procurement & Landed Cost
$$\text{Landed Acquisition Cost} = \text{Purchase Price} + \text{Eligible Acquisition Expenses} - \text{Purchase Credits}$$

### B. Finalized Dealer Capitalized Cost
$$\text{Final Vehicle Cost} = \text{Landed Cost} + \sum \text{Finalized Dealer-Borne Job Card Costs} + \text{Approved Shop Expenses} - \text{Credits}$$
- *Note*: Open job cards contribute exclusively to `estimatedRepairExposure` and do **not** capitalize into the vehicle asset book value until marked `COMPLETED` or `CLOSED`.
- *Note*: `CUSTOMER` cost responsibility allocates ₹0 to dealer inventory cost.

### C. Authoritative Selling Price Recommendations
1. **Target Gross Margin Pricing**:
   $$\text{Selling Price} = \frac{\text{Final Vehicle Cost}}{1 - (\text{Target Margin \%} / 100)}$$
2. **Target Markup Pricing**:
   $$\text{Selling Price} = \text{Final Vehicle Cost} \times \left(1 + \frac{\text{Target Markup \%}}{100}\right)$$

---

## 3. Reducing-Balance EMI Amortization Schedule
$$\text{EMI} = P \times r \times \frac{(1 + r)^n}{(1 + r)^n - 1}$$
- $P$: Principal financed (Agreed Price - Down Payment - Trade-In Allowance + Fees).
- $r$: Monthly interest rate $(\text{Annual Rate} / 1200)$.
- $n$: Tenure in months.
- **Penny Reconciliation Rule**: The final installment forces Principal Paid to equal Opening Principal, guaranteeing exact ₹0.00 closing balance.
