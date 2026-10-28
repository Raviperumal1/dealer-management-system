# DEALEROS — Complete System Audit & Architectural Assessment (Document 01)

## Executive Summary
DEALEROS is a production-grade Dealership Management System designed for automotive dealerships managing both own-inventory acquisitions and consignment/broker vehicle sales. The application provides an integrated suite spanning Vehicle Procurement, Multi-Point Inspection, Workshop Reconditioning & Job Cards, Authoritative Vehicle Costing & Pricing Engine, Customer Sales & Deliveries, In-House and Bank Financing with Reducing-Balance EMI Amortization, and After-Sales Maintenance Services.

---

## 1. System Inventory & Stack Verification

| Tier | Component | Technology / Library | State & Health |
| :--- | :--- | :--- | :--- |
| **Backend** | API Server | Java 21, Spring Boot 3.4.3 | Verified (`mvn test` 30/30 tests passing) |
| **Persistence** | ORM & DB | Spring Data JPA, Hibernate, MySQL, Flyway (V1 - V4) | Pessimistic locking enabled on stock ledger |
| **Security** | Authentication | JWT Token filter, BCrypt password hashing, RBAC | Granular permissions per module |
| **Frontend** | Single Page App | React 18, React Router v6, Redux Toolkit, Vite 6.4.4 | Verified (`npm run build` succeeds in 10.18s) |
| **Design System** | Styling | Bootstrap 5 + Custom Glassmorphism CSS design system | Fully responsive |

---

## 2. Identified Defects, Root Causes & Remediation Register

### DEF-01: Job Card Detail Page Local Arithmetic & Double-Counting (CRITICAL - FINANCIAL)
- **Defect**: In `JobCardDetailPage.jsx`, the card computed `vehicle.sellingPrice + jobCard.totalCost` directly in the browser. When viewing Job Card #8 (₹10,800) and Job Card #9 (₹5,400) on a base vehicle of ₹5,22,000, it rendered ₹5,32,800 and ₹5,27,400 independently.
- **Root Cause**: Frontend bypassed the authoritative backend costing engine and added current job card values onto base procurement prices without recognizing other cards or finalizing statuses.
- **Fix Implemented**: Removed client-side addition. Connected `JobCardDetailPage.jsx` directly to `costingService.getVehicleCost(vehicleId)`. Displayed authoritative recommended price, capitalized vehicle cost (₹5,38,200 if both finalized), and isolated provisional open exposure.

### DEF-02: Open Job Cards Contaminating Capitalized Asset Cost (CRITICAL - DATA INTEGRITY)
- **Defect**: `VehicleCostingServiceImpl.java` aggregated `jc.getShopCost()` across all job cards regardless of status (`OPEN`, `IN_PROGRESS`, etc.).
- **Root Cause**: Lack of status filtering between provisional reconditioning estimates and posted capitalized expenses.
- **Fix Implemented**: Updated `VehicleCostingServiceImpl.java` so only `COMPLETED` and `CLOSED` job cards contribute to `finalizedDealerCost`. Unfinished cards populate `estimatedRepairExposure`.

### DEF-03: Duplicate Stock Issue & Lack of Compensating Reversal (CRITICAL - INVENTORY)
- **Defect**: Floor Mats `ACC-FLM-001` were issued across both Job Cards #8 and #9 with no compensating reversal or return transaction available in `StockLedgerService`.
- **Root Cause**: `StockLedgerService` only had `recordStockIn` and `recordStockOut`.
- **Fix Implemented**: Added `recordStockReturn` (`JOB_CARD_RETURN`) and `recordReversal` (`ADJUSTMENT` with `REV-` reference document) to `StockLedgerServiceImpl.java`.

### DEF-04: Missing Customer-Borne Cost Responsibility (CRITICAL - BUSINESS WORKFLOW)
- **Defect**: `CostResponsibility` enum only had `SHOP`, `BROKER`, `SHARED`. Customer-paid service work accidentally capitalized into dealer inventory cost.
- **Root Cause**: Absence of `CUSTOMER` enum value and zero-allocation logic.
- **Fix Implemented**: Added `CUSTOMER` to `CostResponsibility.java`. In `WorkshopServiceImpl.java`, `CUSTOMER` allocates ₹0 to `shopCost` and ₹0 to `brokerCost`.

### DEF-05: Premature Vehicle Sale Readiness (HIGH - WORKFLOW VIOLATION)
- **Defect**: Vehicles could transition to `READY_FOR_SALE` with pending workshop repairs or safety inspection failures.
- **Root Cause**: `StatusWorkflowServiceImpl.java` validated enum transition maps but did not check repository state for active job cards or unresolved inspections.
- **Fix Implemented**: Injected `JobCardRepository` and `InspectionRepository` into `StatusWorkflowServiceImpl.java`. Blocked transitions to `READY_FOR_SALE` if active job cards exist or if inspection defects remain unaddressed.

### DEF-06: Direct Sales Form Client-Side Job Card Summation (HIGH - FINANCIAL)
- **Defect**: `SaleCreatePage.jsx` executed a client-side reduce across job cards to derive sales price.
- **Root Cause**: Frontend client logic overriding backend pricing.
- **Fix Implemented**: Replaced client summation in `SaleCreatePage.jsx` with authoritative backend recommendation from `costingService.getVehicleCost(vehicleId)`.

### DEF-07: Premature Loan Closure on EMI Completion (MEDIUM - FINANCIAL)
- **Defect**: `FinanceServiceImpl.java` closed loans when all EMI schedule rows reached `PAID`, even if principal balances remained open due to adjustments.
- **Root Cause**: Missing verification of zero outstanding principal.
- **Fix Implemented**: Enforced dual check: all scheduled EMIs paid **and** `principalOutstanding.compareTo(BigDecimal.ZERO) == 0`.
