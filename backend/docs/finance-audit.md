# Advanced Private Finance & Loan Management Master Audit (Module 1)
**Project**: Dealership Management System (Java 21, Spring Boot 3.5, MySQL 8, Flyway, JWT, MapStruct, React Frontend)  
**Package Base**: `com.ims`  
**Date**: October 2026  
**Status**: Architecture Baseline & Gap Analysis Complete  

---

## 1. Executive Summary
This document fulfills **Module 1: Audit and Architecture** of the *Advanced Private Finance & Loan Management Master Specification v2*. It maps all existing entities, REST APIs, formulas, lifecycle states, security barriers, and database schema, identifies gaps against NBFC/RBI standards, and establishes the blueprint for the modular finance engine.

---

## 2. Entity Map & Current Schema Audit

| Existing Entity | Table Name | Purpose | Master v2 Alignment & Deficiencies |
| :--- | :--- | :--- | :--- |
| `FinanceDetailEntity` | `finance_details` | Vehicle loan arrangement (sale-linked) | Uses `DECIMAL(14,2)` instead of `DECIMAL(19,2)`. Lacks versioning, product pointer, moratorium flags, and branch tenancy. |
| `EmiScheduleEntity` | `emi_schedules` | Flat list of monthly installments | Single schedule per loan; no schedule versioning (`schedule_version`), no snapshot or fine-grained waterfall allocation tracking. |
| `FinanceApplicationEntity`| `finance_applications` | Customer loan applications | Lacks multi-borrower co-applicant/guarantor mapping, bureau score versioning, FOIR/LTV policy checks, and maker-checker approval audit. |
| `FinanceLenderEntity` | `finance_lenders` | Bank/NBFC partners | Supports partner lenders. Needs extension for in-house balance sheet portfolios vs external bank tie-ups. |
| `LoanLedgerEntryEntity` | `loan_ledger_entries` | Transaction ledger (`V5`) | Good initial debit/credit foundation, but lacks strict chart-of-accounts mapping, double-entry balanced journals, and subledger trial balance. |
| `LoanPenaltyPolicyEntity` | `loan_penalty_policies` | Preclosure & penal policies (`V5`) | Basic fixed/floating policy exists, but lacks versioned rule evaluation, stamp duty, documentation fees, bounce charges, and tiered LTV/FOIR policies. |
| `LenderCommissionEntity` | `lender_commissions` (`V8`) | Dealership broker commission tracking | Existing payout module for lender/broker commissions; needs clear separation from customer debt ledger. |

---

## 3. Existing API Map (`/api/v1.0/finance`)

| Method | Endpoint | Existing Handler | Target Module Alignment |
| :--- | :--- | :--- | :--- |
| `GET` | `/finance` | `getAllFinance` | Servicing & Loan Register (Module 7 & 18) |
| `GET` | `/finance/{id}` | `getFinanceById` | Loan Detail (Module 7 & 18) |
| `GET` | `/finance/overdue` | `getOverdueEmis` | Collections & DPD Tracking (Module 9) |
| `POST` | `/finance/emis/{id}/pay` | `recordEmiPayment` | Payment Capture (Module 8 - needs waterfall allocation) |
| `POST` | `/finance/calculate` | `calculateEmi` | EMI Calculator (Module 3 & 7 - needs pure BigDecimal half-up) |
| `GET` | `/finance/applications` | `getApplications` | Origination & Pipeline (Module 4) |
| `POST` | `/finance/applications` | `submitApplication` | Loan Origination Wizard (Module 4) |
| `POST` | `/finance/applications/{id}/sanction` | `sanctionApplication` | Sanction & KFS (Module 4) |
| `POST` | `/finance/applications/{id}/disburse` | `disburseApplication` | Disbursement (Module 6) |
| `GET` | `/finance/{id}/foreclosure-quote` | `getForeclosureQuote` | Foreclosure Quote Engine (Module 11) |
| `POST` | `/finance/{id}/close` | `closeLoan` | Foreclosure & Closure (Module 11) |
| `GET` | `/finance/{id}/ledger` | `getLoanLedger` | Loan Ledger (Module 7) |
| `GET` | `/finance/policies` | `getPenaltyPolicies` | Policy & Regulatory Engine (Module 3) |

---

## 4. Current Logic, Formula & Status Inconsistencies

1. **Floating Point Usage in EMI Calculations**:
   - In `FinanceServiceImpl.calculateEmi()`, calculations currently use primitive `double` arithmetic (`Math.pow(1 + r, n)`):
     ```java
     double p = amountFinanced.doubleValue();
     double r = (annualRate.doubleValue() / 100.0) / 12.0;
     double emiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
     ```
   - **Fix Required (Rule 3)**: Replace with pure `BigDecimal` using scale 2 (rates scale 6), `RoundingMode.HALF_UP`. No `double` or `float` anywhere.

2. **Acceptance Test Mathematical Baseline**:
   - Principal: ₹70,000.00 | Rate: 10.00% p.a. | Tenure: 24 months
   - Monthly rate $r = \frac{0.10}{12} = 0.00833333...$
   - $\text{EMI} = \frac{70000 \times r \times (1+r)^{24}}{(1+r)^{24} - 1} = \mathbf{₹3,230.15}$
   - First-month interest: $70000 \times \frac{0.10}{12} = \mathbf{₹583.33}$
   - First-month principal repaid: $3230.15 - 583.33 = \mathbf{₹2,646.82}$
   - Outstanding principal after installment 1: $70000 - 2646.82 = \mathbf{₹67,353.18}$
   - Foreclosure charge (2%): $67353.18 \times 0.02 = \mathbf{₹1,347.06}$
   - Total settlement payable: $67353.18 + 1347.06 = \mathbf{₹68,700.24}$

3. **Status Lifecycle Gaps**:
   - Current statuses (`DRAFT`, `SUBMITTED`, `APPROVED`, `DISBURSED`, `ACTIVE`, `CLOSED`, `REJECTED`) do not support full private finance lifecycle:
     - Missing: `AGREEMENT_PENDING`, `DISBURSEMENT_PENDING`, `FORECLOSURE_IN_PROGRESS`, `SETTLED_OTS`, `REPOSSESSED`, `RESTRUCTURED`.
     - Delinquency classifications (`SMA-0`, `SMA-1`, `SMA-2`, `NPA`) must be dynamic attributes derived on top of `ACTIVE`, not hard-mutating base status.

4. **Security & RBAC Gaps**:
   - Sensitive financial operations currently check general `FINANCE:EDIT` without strict maker-checker segregation of duties (e.g., sanction approver, foreclosure quote approver, fee waiver approver).

---

## 5. Target Architecture & Package Layout

In accordance with Module 1, all newly engineered services, models, and domain components are organized into explicit modular packages under `com.ims.finance`:

```
com.ims.finance
├── customer         # Customer 360, nominees, references, co-borrowers
├── kyc              # Identity documents, Aadhaar/PAN masking, consent
├── product          # LoanProduct, versioned policy tables, rate cards
├── application      # Loan origination wizard, applicant financial profiles
├── underwriting     # FOIR, LTV, bureau score adapter, risk scoring
├── loan             # Loan account root, state machine, terms versions
├── ledger           # Authoritative LoanAccountingService, append-only entries
├── schedule         # Versioned amortization schedule engine, interest accrual
├── payment          # Payment capture, waterfall allocation, receipts, cash book
├── collection       # DPD buckets, SMA/NPA, promises to pay, follow-ups
├── foreclosure      # Foreclosure quote engine, stale checking, OTS waiver
├── closure          # Atomic closure service, no-dues verification
├── document         # PDF generators (KFS, sanction letter, NOC), QR verification
├── accounting       # Subledger, double-entry balanced journals, GST, Tally export
├── report           # Portfolio KPIs, aging, collection efficiency, regulatory returns
├── notification     # SMS/WhatsApp/Email delivery adapters
├── audit            # Immutable financial audit logs, before/after snapshots
├── config           # NBFC policy configuration, statutory limits
└── security         # Maker-checker, role-action permission matrix
```

---

## 6. Migration Plan

- **Step 1 (Modules 1, 3, 7)**:
  - Create package hierarchy under `com.ims.finance.*`.
  - Introduce `V9__advanced_private_finance_schema.sql` defining versioned product policies, versioned loan terms, schedules, and append-only ledger entries with `DECIMAL(19,2)`.
  - Implement pure `BigDecimal` `LoanAccountingService` and `ScheduleEngine`.
- **Step 2 (Modules 8, 12)**:
  - Implement payment waterfall allocation, gapless receipt sequencing, and PDF generation with QR verification.
- **Step 3 (Modules 2, 4, 5, 6)**:
  - Origination, KYC consent, credit evaluation, maker-checker sanction, and disbursement.
- **Step 4 (Modules 9, 10, 11, 13, 14)**:
  - Delinquency & NPA EOD engine, restructuring, foreclosure & closure verification, and double-entry accounting journals.
- **Step 5 (Modules 18, 19, 20)**:
  - React frontend wiring, Testcontainers integration suite, and comprehensive delivery verification.
