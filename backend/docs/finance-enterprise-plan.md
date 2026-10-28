# Enterprise Finance & Lending Architecture Implementation Plan
**Document Version**: 2.0  
**Scope**: Advanced Private Finance & Loan Management Master Prompt v2 + Additional Enterprise Finance Requirements (A through J)  
**Target Platform**: Spring Boot 3.5 (Java 21), MySQL 8, Flyway, JWT, React Frontend  
**Authoritative Ledger Principle**: Pure `BigDecimal` (Scale 2, rates scale 6, `HALF_UP`), `DECIMAL(19,2)`, append-only journal/subledger, pessimistic locking, idempotent writes.

---

## 1. Role Categorization & Enterprise Feature Boundary
Under RBI directions and corporate governance, automobile dealerships operate under two distinct financing models:
1. **Third-Party / Bank / NBFC Channel Financing (DSA / Lending Partner Model)**:
   - Origination, customer application intake, documentation checklist, lender submission, commission accrual, payout reconciliation, and customer delivery coordination.
   - The dealership acts as a corporate agent/broker, not the balance-sheet lender. Customer liabilities are owed to the lending partner.
2. **In-House / Private Dealership Financing (Book Lending Model)**:
   - The dealership (or its affiliated proprietary lending arm) advances credit directly.
   - Full lifecycle: loan products, policy engine, agreement, security register, hypothecation, schedule generation, payment waterfall, collections/DPD/NPA, foreclosure quotes, and no-dues closure with NOC.

The engine must support both modes cleanly without conflating customer principal liability with dealership commission income.

---

## 2. Feature Classification (Implementation Rule)

| Category | Modules & Features Included | Persistence & Engine Status |
| :--- | :--- | :--- |
| **1. Core Features** (Immediate Business Need) | • Loan products & versioned policy engine (`V9` schema)<br>• Pure `BigDecimal` Amortization Schedule Engine (`ScheduleEngine`)<br>• Append-Only `LoanAccountingService` (Ledger)<br>• Payment waterfall allocation (`PaymentAllocationService`)<br>• Foreclosure & Early Settlement Engine with configurable RBI exemptions<br>• Atomic No-Dues Closure Service (`LoanClosureService`) | Backend service, entity, migration, and unit test suite. |
| **2. Enterprise Features** (Architecture Extensible) | • Customer 360 with KYC status, PAN/Aadhaar masking, co-borrowers & guarantors<br>• Security register (Vehicle hypothecation, PDC tracking)<br>• Maker-checker approval matrix for Sanction, Waivers, and Restructuring<br>• Collections workbench (DPD aging, SMA-0/1/2, NPA classification)<br>• Subledger double-entry balanced journal entries & Tally export format | Implemented in `com.ims.finance.*` with database backing. |
| **3. Integration Adapters** (Mock + Real-Ready) | • Credit Bureau Adapter (`BureauIntegrationService`)<br>• e-NACH / UPI AutoPay Mandate Adapter<br>• SMS / WhatsApp notification gateway adapter<br>• Bank Statement CSV reconciliation engine | Adapter pattern with fully functional Mock dev implementation + extensible interfaces. |
| **4. Regulatory & Legal Controls** | • Versioned policy rules with effective dates<br>• Fair Practices Code & Key Fact Statement (KFS) generation<br>• Stale quote detection with snapshot hashes<br>• Marked as *"verify with compliance counsel"* | System configuration tables with audit logs. |

---

## 3. Package Structure Blueprint (`com.ims.finance.*`)

```
com.ims.finance
├── product          # LoanProductEntity, LoanPolicyEntity, RateCard
├── schedule         # ScheduleEngine, AmortizationSchedule, DayCountConvention
├── ledger           # LoanAccountingService, LoanLedgerEntry, DoubleEntryJournal
├── payment          # PaymentCaptureService, PaymentWaterfallEngine, ReceiptSequence
├── foreclosure      # ForeclosureService, ForeclosureQuote, SettlementEngine
├── closure          # LoanClosureService, NocIssuanceService
├── underwriting     # BureauIntegrationService (Mock/Adapter), ScoringEngine
└── audit            # Immutable financial audit events
```

---

## 4. Phase-by-Phase Execution Order

### Phase 1: Foundations (Modules 3 & 7)
1. **Migration `V9__advanced_private_finance_schema.sql`**:
   - `loan_products` (type, rate type, min/max limits)
   - `loan_policies` (versioned fees, grace days, bounce charges, foreclosure rules, waterfall config)
   - `loan_accounts` (formal loan account linking sale/customer/product with versioning and `DECIMAL(19,2)`)
   - `loan_schedule_versions` & `loan_installments`
   - `loan_ledger_journals` (append-only double-entry financial journals)
2. **Schedule Engine (`com.ims.finance.schedule.ScheduleEngine`)**:
   - Pure `BigDecimal` reducing-balance, flat-rate, and zero-interest amortization.
   - Reconciles final installment paise residual.
   - Passes the acceptance test benchmark (₹70,000 / 10% / 24 months → EMI = ₹3,230.15).
3. **Authoritative Ledger Engine (`com.ims.finance.ledger.LoanAccountingService`)**:
   - Pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
   - Append-only ledger entries; balanced double-entry journals (`totalDebit == totalCredit`).

### Phase 2: Servicing, Waterfall & Foreclosure (Modules 8 & 11)
1. **Payment Waterfall Engine**:
   - Strict priority allocation: Taxes → Penalties & Bounce → Other Fees → Overdue Interest → Overdue Principal → Current Interest → Current Principal → Advance/Excess credit.
2. **Foreclosure & Settlement Engine**:
   - Configurable policy version evaluation (zero charge for individual floating-rate loans per RBI).
   - Snapshot hash generation for quote staleness detection.
   - Separation of duty: Maker-checker approval on foreclosure settlements.
   - Atomic closure gated on zero outstanding balance and no pending payments.

### Phase 3: Origination, Underwriting & Documents (Modules 4, 5, 6 & 12)
1. **Application & Underwriting**:
   - FOIR and LTV calculation, co-borrower/guarantor mapping, and Bureau adapter.
   - Sanction workflow with Key Fact Statement (KFS).
2. **Disbursement**:
   - Fee deduction at source, net disbursement calculation, and dealer/lender settlement split.
3. **Documents**:
   - Unique gapless receipt sequence, KFS, and NOC generation.

### Phase 4: UI & Testing (Modules 18, 19, 20)
1. **Verification Test Suite**:
   - Mathematical precision unit tests.
   - Amortization invariant tests (sum of principal equals disbursed principal).
   - Testcontainers / Spring Boot integration tests for full lifecycle (Disbursement → EMI → Foreclosure → Closure).
2. **Frontend Wiring**:
   - Update `FinanceDetailPage.jsx` and `FinanceListPage.jsx` to interface with the new authoritative endpoints.
   - Verify build and tests.
