# DEALEROS — Bugs, Feature Gaps & Risk Assessment (Document 13)

## 1. Prioritized Findings Register

| ID | Module | Severity | Classification | Description | File Path / Evidence | Impact & Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Finance | High | **RESOLVED** | `TypeError: financeService.getFinanceMetrics is not a function` in `FinanceListPage.jsx` | `financeService.js` | Exported method name differed from component call. Fixed by adding unified aliases in `financeService.js`. |
| **BUG-02** | Finance | Medium | **RESOLVED** | `EmiCalculatorRequest` expected `vehicleAmount` while frontend sent `saleAmount` | `financeService.js` | Payload mapping added in `calculateEmi` function ensuring bidirectional field compatibility. |
| **GAP-01** | Document Storage | Low | Architecture | File upload currently saves to local filesystem (`uploads/`) | `FileStorageServiceImpl.java` | In multi-instance cloud deployments (e.g. AWS/Azure), local disk storage is ephemeral. Recommend configuring S3/MinIO cloud storage provider. |
| **GAP-02** | External Bank APIs | Low | Integration | External bank loan statuses currently rely on manual showroom operator updates | `FinanceServiceImpl.java` | Indian lenders (HDFC, ICICI) do not provide open public loan sanction webhook APIs to unaccredited third parties. The manual file status workflow is correct for dealer DMS; official bank API adapters can be added as banks grant partner credentials. |
| **RISK-01**| Database Backups | Medium | Operational | Automated nightly mysqldump not configured in repository | Docker/Compose | Recommend adding an automated cron dump script for `dealership_db` to protect transactional history. |
