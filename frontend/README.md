# DEALEROS DMS Enterprise — Automotive Dealership Management System

> **Enterprise Used Car & Bike Dealership Management System**  
> *Production-Ready Frontend inspired by the DEALEROS SaaS reference architecture, built with React 18, Vite, Bootstrap 5.3+, Redux Toolkit, React Hook Form, Zod, and Recharts, integrated with Java Spring Boot REST API.*

---

## 1. Executive Architecture Overview

**AutoManage Pro** is an enterprise-grade Dealership Management System (DMS) tailored specifically for multi-channel automotive retailers dealing with pre-owned Cars and Two-Wheelers (Bikes). The platform delivers end-to-end operational automation across vehicle procurement, refurbished workshop servicing, sales contracts, customer financing, and broker consignments.

### Key Architectural Tenets:
- **Strict Consignment Separation:** Distinct handling for **OWN** (dealership-purchased asset with purchase price, refurbishing cost, total cost basis, and dealer profit) versus **BROKER** (consignment vehicle with commission agreement, owner settlement payout, and shop/broker expense sharing).
- **10-Menu RBAC Permission System:** Fine-grained authorization based on backend `MenuPermissionDto` (`DASHBOARD`, `VEHICLES`, `BROKERS`, `WORKSHOP`, `INVENTORY`, `SALES`, `CUSTOMERS`, `SERVICE`, `REPORTS`, `ADMIN`), with full superuser bypass for `ROLE_ADMIN` and restrictive read/write permissions for `ROLE_STAFF`.
- **Modular Feature Architecture:** Feature-sliced code layout with local schemas, services, and components, ensuring high maintainability and testability.
- **Enterprise Design Tokens:** Built on Bootstrap 5.3+ utilities paired with modern CSS custom properties (`variables.css`, `layout.css`, `components.css`) ensuring high contrast, clean typography (Inter + Plus Jakarta Sans), and zero styling conflicts.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React.js | 18.3.1 | Core UI view layer with functional components & hooks |
| **Bundler & Dev Server** | Vite | 6.1.0 | Fast HMR development and optimized production bundling |
| **CSS Framework** | Bootstrap | 5.3.3 | Responsive grid, tables, cards, modal dialogs, and utilities |
| **Icons** | Lucide React | 0.475.0 | Consistent iconography across navigation and table actions |
| **Client Routing** | React Router DOM | 6.28.2 | Declarative nested routing, protected routes, and lazy loading |
| **Global State** | Redux Toolkit | 2.5.1 | Centralized auth, role permissions, and global toast feedback |
| **HTTP Client** | Axios | 1.7.9 | Centralized client with JWT injection and envelope unwrapping |
| **Form Management** | React Hook Form | 7.54.2 | High-performance uncontrolled forms with minimal re-renders |
| **Schema Validation** | Zod + HookForm Resolver | 3.24.2 | Strict schema enforcement, RegEx validations, and type safety |
| **Analytics & Charts** | Recharts | 2.15.1 | Responsive SVG bar charts, line charts, and pie charts |
| **Date Utilities** | date-fns | 3.6.0 | Standardized Indian date formatting (`dd/MM/yyyy`) |
| **Testing Suite** | Vitest + RTL + JSDOM | 3.0.5 | Fast headless unit and component testing |

---

## 3. Directory Layout

```text
dealership-frontend/
├── public/
│   ├── favicon.svg
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.jsx             # Main application orchestrator & session hydration
│   │   ├── router.jsx          # Declarative router with lazy-loading & guards
│   │   └── store.js            # Redux Toolkit store (auth + ui slices)
│   ├── components/
│   │   ├── common/             # Reusable UI controls (DataTable, MoneyDisplay, StatusBadge, etc.)
│   │   └── layout/             # Shell layout (AppLayout, Sidebar, Header)
│   ├── features/
│   │   ├── auth/               # Login, Profile, Password Change
│   │   ├── dashboard/          # Executive KPI cards & Recharts analytics
│   │   ├── vehicles/           # Vehicles list, inventory, detail, forms (Own vs Broker)
│   │   ├── purchases/          # Dealership vehicle acquisition records
│   │   ├── brokers/            # Consignment brokers, commission setups, and KPIs
│   │   ├── settlements/        # Broker payout settlements & payment history
│   │   ├── inspections/        # 15-point mechanical inspection checklists
│   │   ├── jobCards/           # Workshop repair cards, parts issue, labour & cost split
│   │   ├── inventory/          # Spare parts catalogue, purchase invoices, stock ledger
│   │   ├── suppliers/          # Spare parts vendor management
│   │   ├── costing/            # Vehicle profit vs broker net commission
│   │   ├── customers/          # Customer directory, KYC & 360-degree timeline
│   │   ├── bookings/           # Vehicle bookings & advance token collection
│   │   ├── sales/              # Sales orders, direct/finance contracts, invoice receipts
│   │   ├── deliveries/         # Vehicle handovers, odometer gate passes & checklists
│   │   ├── finance/            # EMI loan ledger, amortization schedules & due tracking
│   │   ├── services/           # After-sales service records & workshop history
│   │   ├── followups/          # CRM reminder calls & customer interaction logs
│   │   ├── reports/            # Vehicle, sales, profit, broker, stock & service reports
│   │   ├── users/              # Employee user administration & status management
│   │   ├── roles/              # Role definitions & 10-menu permission matrices
│   │   └── ui/                 # Toast notification system & sidebar UI state
│   ├── hooks/                  # Custom hooks (useAuth, usePermission, useDebounce, usePagination)
│   │   ├── apiClient.js        # Axios instance with interceptors and unrolling
│   │   └── [feature]Service.js # Dedicated REST API services
│   ├── styles/                 # Enterprise design system (variables, global, layout, components)
│   ├── utils/                  # Currency (INR), date formatting, permissions, formatters
│   ├── tests/                  # Vitest test suite and component tests
│   ├── index.css               # Global stylesheet entry point
│   └── main.jsx                # React root mount
├── nginx.conf                  # Production SPA reverse-proxy configuration
├── Dockerfile                  # Multi-stage production container build
├── compose.yaml                # Docker Compose deployment definition
├── vite.config.js              # Vite configuration with local proxy to port 8081
├── package.json                # Project dependencies and scripts
└── README.md                   # Documentation and runbook
```

---

## 4. Setup and Run Guide (Windows PowerShell)

### Prerequisites:
- **Node.js:** v18.0.0 or higher (Tested on Node v24.14.0)
- **npm:** v9.0.0 or higher
- **Backend:** Java Spring Boot running on `http://localhost:8081`

### Step 1: Install Dependencies
Open PowerShell in the `dealership-frontend` directory:
```powershell
cd d:\dealershipManagementSystem\dealership-frontend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default configuration:
```properties
VITE_API_BASE_URL=http://localhost:8081/api/v1.0
VITE_APP_NAME="AutoManage Pro Enterprise DMS"
```

### Step 3: Start Development Server
```powershell
npm run dev
```
The application will launch at `http://localhost:5173`. Vite is pre-configured with a reverse proxy forward for all `/api/v1.0` calls to `http://localhost:8081`.

### Step 4: Run Automated Tests
```powershell
npm test
```
Runs the Vitest suite covering permissions, Indian Rupee currency formatters, and reusable UI components.

### Step 5: Build Production Static Bundle
```powershell
npm run build
```
Creates an optimized, tree-shaken, gzipped production distribution in the `./dist` folder.

---

## 5. Docker Deployment

### Run with Docker Compose:
```powershell
docker compose up -d --build
```
This builds the production bundle and starts an Nginx alpine container on port `80`, routing SPA client-side requests to `index.html` and proxying API traffic directly to the Spring Boot backend service.

---

## 6. Business Workflows & Rule Adherence

### 1. Vehicle Ownership (OWN vs BROKER)
- **OWN Vehicles:**
  - Purchased by dealership from a seller or auction.
  - Requires `purchaseAmount` and purchase date.
  - Workshop repairs and replacement parts increase vehicle cost basis (`totalCost = purchaseAmount + purchaseExpenses + repairCost`).
  - Gross Profit = `Sale Price - Total Cost Basis`.
- **BROKER Consignments:**
  - Consigned by a third-party broker for listing and showroom display.
  - Dealership never owns the asset; inventory value is ₹0.
  - Requires `brokerId`, commission type (`FIXED` vs `PERCENTAGE`), and commission value.
  - Workshop repairs have cost responsibility: `SHOP` (deducted from dealer commission), `BROKER` (deducted from broker settlement), or `SHARED`.
  - Broker Net Commission = `Gross Commission - Shop Borne Repair Expenses`.

### 2. 15-Point Pre-Purchase & Inward Inspection Checklist
Supports comprehensive mechanical and cosmetic audit across 15 standard checkpoints:
1. Engine  
2. Gearbox  
3. Clutch  
4. Battery  
5. Tyres  
6. Brakes  
7. Suspension  
8. Air Conditioning (AC)  
9. Electrical Systems  
10. Headlights & Taillights  
11. Body Panels  
12. Paint Finish  
13. Interior Upholstery  
14. Steering & Alignment  
15. Other / Accessories  

Each item records condition (`GOOD`, `NEED_REPAIR`, `REPLACE`, `NOT_AVAILABLE`), notes, and recommendations. Inward inspections allow instant 1-click creation of a workshop Job Card.

### 3. Workshop Job Cards & Parts Inventory
- Multi-item repair tasks with technician assignment and estimated hours.
- Direct spare parts consumption with real-time stock verification.
- Parts purchase invoices with `POSTED` status triggers automatic stock addition.
- Stock movements audit ledger records all transactions (`PURCHASE_INWARD`, `JOB_CARD_CONSUMPTION`, `SERVICE_CONSUMPTION`, `ADJUSTMENT`).

### 4. Sales, Deliveries & Financing
- **Direct Sales:** Requires 100% payment receipt before vehicle handover can be marked complete.
- **Finance Sales:** Integrates loan provider details, down payment, financed principal, interest rate, tenure in months, and calculated EMI schedule.
- **Physical Delivery:** Records recipient KYC, mobile verification, and odometer reading at gate exit.

---

## 7. Role-Based Access Control (RBAC) Matrix

Adheres strictly to the 10 core functional menu modules:

| Menu Code | Route Prefix | ROLE_ADMIN | ROLE_STAFF |
| :--- | :--- | :---: | :---: |
| `DASHBOARD` | `/dashboard` | View, Filter | View |
| `VEHICLES` | `/vehicles`, `/purchases` | Full Access (Add, Edit, Delete, Status) | View, Add, Edit |
| `BROKERS` | `/brokers`, `/settlements` | Full Access (Add, Edit, Settle) | *No Access* |
| `WORKSHOP` | `/inspections`, `/job-cards` | Full Access (Create, Assign, Close) | View, Add, Edit |
| `INVENTORY` | `/inventory`, `/suppliers` | Full Access (Add Parts, Post Invoices) | View, Consume Parts |
| `SALES` | `/bookings`, `/sales`, `/deliveries` | Full Access (Create, Pay, Deliver) | View, Book, Sell |
| `CUSTOMERS` | `/customers` | Full Access (Add, Edit, View 360°) | View, Add, Edit |
| `SERVICE` | `/service`, `/follow-ups` | Full Access (Create, Schedule, Call) | View, Add, Follow-up |
| `COSTING` | `/costing` | Full Access (View Financials) | View Cost Summaries |
| `REPORTS` | `/reports` | Full Access (View, Export Excel/PDF) | *No Access* |
| `ADMIN` | `/users`, `/roles` | Full Access (Create Users, Permissions) | *No Access* |

---

## 8. Verification & QA Status

- **Automated Unit & Component Tests:** 10/10 passed (Vitest + JSDOM).
- **Production Build:** Vite built in 8.63s with zero warnings or errors (`dist/index.html`, 74 code-split JS chunks, optimized Bootstrap CSS).
- **Backend Integration:** All endpoints mapped to Spring Boot `@RestController` contract at `/api/v1.0`.
