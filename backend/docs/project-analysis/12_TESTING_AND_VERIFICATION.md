# DEALEROS — Testing & Runtime Verification (Document 12)

## 1. Automated Test Suites Discovered in Repository

### 1.1 Backend Test Suites (JUnit 5 + Mockito + Testcontainers)
Located in [`src/test/java/com/ims`](file:///d:/dealershipManagementSystem/src/test/java/com/ims):
- `DealershipManagementSystemApplicationTests.java`: Context loads check.
- `service/VehicleServiceTest.java`: Tests vehicle registration uniqueness, VIN/chassis validation, and state machine transitions.
- `service/SaleServiceTest.java`: Tests direct payment settlement, broker commission calculation, and stock transition to `SOLD`.
- `service/FinanceServiceTest.java`: Tests compound reducing-balance EMI math, penny reconciliation, and foreclosure calculations.

### 1.2 Frontend Test Suites (Vitest + React Testing Library)
Located in [`dealership-frontend/src/tests`](file:///d:/dealershipManagementSystem/dealership-frontend/src/tests):
- `components/MoneyDisplay.test.jsx`: Validates Indian numbering system formatting (`₹1,50,000`).
- `components/StatusBadge.test.jsx`: Validates badge color mapping.
- `features/auth/authSlice.test.js`: Validates login, logout, and token storage.

---

## 2. Runtime Verification Log & Results

| Check / Workflow | Execution Command | Result | Evidence / Log Reference |
| :--- | :--- | :--- | :--- |
| **Backend Compilation** | `.\mvnw.cmd compile` | **PASSED** | 302 source files compiled cleanly with 0 errors |
| **Backend Server Launch**| `.\mvnw.cmd spring-boot:run` | **PASSED** | Started on port `8081` with context path `/api/v1.0` in 13.05s |
| **Database Migrations** | Flyway automatic execution | **PASSED** | Migrations `V1` to `V4` applied cleanly on MySQL `dealership_db` |
| **Actuator Health Check**| `GET /api/v1.0/actuator/health` | **PASSED** | Returns `{"status":"UP"}` |
| **EMI Calculator Endpoint**| `POST /api/v1.0/finance/calculate` | **PASSED** | Verified with ₹8L sale, ₹2L down, ₹50k trade-in, 10.5% ROI, 36mo: monthly EMI ₹18,038.86; closing principal reaches exactly ₹0.00 |
| **Frontend Production Build**| `npm run build` | **PASSED** | Vite 6 built 2694 modules in 10.18s with 0 errors |
| **Frontend Runtime Load**| Browser test at `http://localhost:5173` | **PASSED** | Sidebar, Dashboard, Vehicles, Inventory, Sales, Finance, Customers rendered without console errors |
