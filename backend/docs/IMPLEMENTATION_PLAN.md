# DEALEROS — Implementation & Execution Plan (Document 03)

## 1. Implementation Phases & Status Matrix

| Phase | Description | Key Modules | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Project & Database Audit | Architecture review, stack audit | **COMPLETED** |
| **Phase 2** | Workflow Mapping & Defect Isolation | Discovered Job Cards 8 & 9 discrepancy, stock deductions | **COMPLETED** |
| **Phase 3** | Authoritative Costing Engine Implementation | `VehicleCostingServiceImpl`, `VehicleCostResponse` | **COMPLETED** |
| **Phase 4** | Workshop & Cost Allocation Refactor | `CostResponsibility`, `JobCardStatus`, `WorkshopServiceImpl` | **COMPLETED** |
| **Phase 5** | Inventory Control & Reversal Safeguards | `StockLedgerServiceImpl` return and reversal methods | **COMPLETED** |
| **Phase 6** | Sale-Readiness Guardrails | `StatusWorkflowServiceImpl` inspection & job card validation | **COMPLETED** |
| **Phase 7** | Finance & Sales Reconciliation | `SaleServiceImpl`, `FinanceServiceImpl` closure rule | **COMPLETED** |
| **Phase 8** | Frontend Integration & UI Corrections | `JobCardDetailPage.jsx`, `SaleCreatePage.jsx`, `VehicleDetailPage.jsx` | **COMPLETED** |
| **Phase 9** | Automated Testing & Regression Suite | 30/30 Java tests (`mvn test`), React production build | **COMPLETED** |
| **Phase 10** | Production Verification & Documentation | Audit docs, acceptance criteria checklist | **COMPLETED** |

---

## 2. Inventory Reconciliation & Duplicate Floor Mat Handling (`ACC-FLM-001`)

### Operational Guidelines:
1. When Job Card #8 and Job Card #9 both contain `ACC-FLM-001` (₹4,200), determine whether:
   - Parts were physically installed twice on the vehicle (valid repeat usage).
   - One job card was entered in error or duplicated administratively.
2. If confirmed duplicate:
   - Cancel Job Card #9 (`updateJobCardStatus` to `CANCELLED`).
   - Execute an auditable compensating stock reversal via `stockLedgerService.recordReversal(...)` which writes a compensating movement (`REV-JC-009`) restoring stock count without deleting the ledger trail.
   - The vehicle costing engine automatically excludes cancelled or customer-borne cards from finalized dealer cost.
