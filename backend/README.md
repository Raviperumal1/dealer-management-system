# Enterprise Used Car & Bike Dealership Management System — Production-Ready Java Backend

A robust, enterprise-grade dealership management system (DMS) built with **Java 21 LTS** and **Spring Boot 3.4.x**. This system manages the complete commercial, inventory, workshop, and financial lifecycle of both **Dealership-Owned Vehicles** and **Broker-Consigned Vehicles**, adhering strictly to dealership operational accounting principles and transactional concurrency guarantees.

---

## 1. System Architecture & Request Flow

The backend is built as a **Modular Monolith** with clear domain boundaries, strong encapsulation, and thin controllers:

```
Client (Web / Mobile)
   ↓
Spring Security Filters (CORS, Rate Limiting & JWT Authentication)
   ↓
Role & Menu-Action Authorization (@PreAuthorize with PermissionService)
   ↓
REST Controller (Thin HTTP layer, Request Validation)
   ↓
Service Interface & Implementation (Authoritative Domain Business Logic & Accounting)
   ↓
Pessimistic Concurrency Locking / Stock Ledger / Status Workflow Service
   ↓
Spring Data JPA / Hibernate ORM
   ↓
MySQL 8.0 (Flyway Migrations V1 & V2)
```

### Core Architecture Principles
- **DTOs at API Boundary:** JPA entities are never exposed directly to clients.
- **Transactional Safety:** Pessimistic write locks (`@Lock(PESSIMISTIC_WRITE)`) on vehicle sales and inventory stock movements prevent race conditions (double sales and negative inventory).
- **Idempotent Transactions:** High-risk financial operations (customer payments, bookings, deliveries) support client-supplied idempotency keys (`idempotencyKey`).
- **Auditing:** All database entities inherit from `BaseEntity` with automatic creation and modification timestamps, plus explicit `VehicleStatusHistoryEntity` audit trails.

---

## 2. Technology Stack

- **Platform:** Java 21 LTS (OpenJDK / JetBrains Runtime)
- **Framework:** Spring Boot 3.4.2
- **Persistence:** Spring Data JPA & Hibernate 6.6.5
- **Database:** MySQL 8.0 (with Flyway database migrations)
- **Security:** Spring Security 6.4 + JJWT 0.12.6 (Access Tokens + Revocable Refresh Tokens) + BCrypt
- **Validation:** Jakarta Bean Validation (Hibernate Validator)
- **Object Mapping:** MapStruct 1.6.3
- **Boilerplate Reduction:** Project Lombok
- **API Documentation:** Springdoc OpenAPI 2.8.5 with Swagger UI
- **Health & Monitoring:** Spring Boot Actuator
- **Excel & PDF Export:** Apache POI 5.4.0 (Spreadsheets) & OpenPDF 2.0.3 (PDF Documents)
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 Database (MySQL compatibility mode)
- **Containerization:** Multi-stage Dockerfile & Docker Compose

---

## 3. Core Business Rules & Accounting Principles

### 3.1 Own Vehicles vs. Broker Consignment Vehicles

| Feature | Dealership-Owned Vehicle | Broker-Consigned Vehicle |
| :--- | :--- | :--- |
| **Ownership** | Dealership owns the vehicle | Broker/external party owns the vehicle |
| **Purchase Record** | Mandatory (`vehicle_purchases`) | Never creates purchase record |
| **Purchased Inventory** | Included in dealership asset balance | **Display only**; never counted in purchased stock |
| **Inspection & Workshop** | Yes | Yes |
| **Inventory Stock Usage** | Consumes stock | Consumes stock |
| **Recognized Profit/Income** | `Gross Profit = Final Sale Price - Total Cost` | `Net Commission = Gross Commission - Shop Expenses` |
| **Broker Settlement** | Not applicable | Tracked via `broker_settlements` (Pending / Partial / Paid) |
| **After-Sales Service** | Supported | Supported |

### 3.2 Vehicle Costing Formulas
- **Own Vehicle Total Cost:**
  $$\text{Total Cost} = \text{Purchase Price} + \text{Purchase Expenses} + \text{Shop-Borne Repairs} + \text{Accessories} + \text{Labour} + \text{Other Expenses}$$
- **Own Vehicle Gross Profit:**
  $$\text{Gross Profit} = \text{Net Recognized Sale Value} - \text{Total Vehicle Cost}$$
  *Example (SRD Scenario 1):* Purchase ₹5,00,000 + Repairs ₹50,000 + Accessories ₹20,000 + Other Expenses ₹10,000 = ₹5,80,000 Total Cost. Sale at ₹7,50,000 yields ₹1,70,000 Gross Profit.

### 3.3 Broker Commission & Settlement Formulas
- **Gross Commission (Fixed or Percentage):**
  - **Fixed:** Configured fixed fee (e.g. ₹25,000).
  - **Percentage:** $\text{Eligible Sale Price} \times \frac{\text{Percentage}}{100}$ (e.g. $8,00,000 \times 3\% = \text{₹}24,000$).
  - **Margin-based:** $\text{Customer Selling Price} - \text{Broker Settlement Basis}$ (e.g. ₹8,00,000 - ₹7,75,000 = ₹25,000).
- **Net Commission:**
  $$\text{Net Commission} = \text{Gross Commission} - \text{Shop-Borne Repairs} - \text{Other Shop Expenses}$$
- **Repair Cost Allocation (Scenario 3):**
  Repairs on broker vehicles support `SHOP`, `BROKER`, and `SHARED` responsibility. For example, a ₹20,000 repair with ₹15,000 broker responsibility and ₹5,000 shop responsibility allocates only ₹5,000 against dealership expenses.

### 3.4 Inventory Stock Rules
- Stock increases upon posting a Purchase Invoice (`POSTED` status).
- Stock automatically decreases when parts are consumed in Workshop Job Cards or After-Sales Service Records.
- Transactional stock ledger records all movements with movement types: `PURCHASE_IN`, `JOB_CARD_USAGE`, `SERVICE_USAGE`, `ADJUSTMENT`.
- Negative stock is strictly prevented using database locking.

---

## 4. Vehicle Lifecycle State Machine

### Own Vehicle Workflow
```
PURCHASED → INSPECTION → JOB_CARD / REPAIR → READY_FOR_SALE → AVAILABLE → BOOKED → SOLD → DELIVERED → SERVICE_FOLLOWUP
```

### Broker Vehicle Workflow
```
BROKER_LISTED → INSPECTION → JOB_CARD / REPAIR → READY_FOR_SALE → AVAILABLE → BOOKED → SOLD → SETTLEMENT_PENDING / SETTLED → DELIVERED → SERVICE_FOLLOWUP
```

Every transition is validated by `StatusWorkflowService` and logged with timestamp, user, previous status, new status, and audit reason in `vehicle_status_history`.

---

## 5. Role & Menu Permission Matrix

Default roles provisioned via database seed:
- `ROLE_ADMIN`: Full access across all menus and actions.
- `ROLE_STAFF`: Granular, configurable access based on PowerPoint Slide 15:

| Menu | Admin Access | Staff Default Access | Controlled Actions |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Full | View Only | `view` |
| **Vehicles / Purchase** | Full | Add, Edit | `view`, `add`, `edit`, `delete` |
| **Brokers & Settlement** | Full | **No Access** | `view`, `add`, `edit`, `pay` |
| **Inspection & Job Card** | Full | Full | `view`, `add`, `edit`, `status` |
| **Parts & Stock** | Full | Manage Parts | `view`, `add`, `edit`, `adjust` |
| **Sales & Finance** | Full | Create Sale | `view`, `add`, `edit`, `price` |
| **Customers** | Full | Add, Edit | `view`, `add`, `edit` |
| **Service Follow-up** | Full | Full | `view`, `add`, `edit` |
| **Reports** | Full | **No Access** | `view`, `export` |
| **Users & Permissions** | Full | **No Access** | all administrative actions |

---

## 6. Project Structure

```
dealershipManagementSystem/
├── .mvn/wrapper/                                # Maven wrapper configuration
├── docker/                                      # Docker support scripts
├── src/
│   ├── main/
│   │   ├── java/com/ims/
│   │   │   ├── DealershipManagementSystemApplication.java
│   │   │   ├── common/                          # ApiResponse, PageResponse, PageUtil
│   │   │   ├── config/                          # SecurityConfig, CorsConfig, OpenApiConfig, DataInitializer
│   │   │   ├── controller/                      # Feature REST Controllers
│   │   │   │   ├── auth/                        # AuthController (/auth/login, refresh, logout)
│   │   │   │   ├── user/                        # UserController (/users)
│   │   │   │   ├── role/                        # RoleController (/roles)
│   │   │   │   ├── permission/                  # MenuController (/menus)
│   │   │   │   ├── vehicle/                     # VehicleController (/vehicles)
│   │   │   │   ├── broker/                      # BrokerController (/brokers)
│   │   │   │   ├── settlement/                  # SettlementController (/settlements)
│   │   │   │   ├── inspection/                  # InspectionController (/inspections)
│   │   │   │   ├── jobcard/                     # JobCardController (/job-cards)
│   │   │   │   ├── supplier/                    # SupplierController (/suppliers)
│   │   │   │   ├── inventory/                   # PartController, PurchaseInvoiceController, StockController
│   │   │   │   ├── costing/                     # CostingController (/vehicles/{id}/costing)
│   │   │   │   ├── expense/                     # ExpenseController (/expenses)
│   │   │   │   ├── customer/                    # CustomerController (/customers)
│   │   │   │   ├── sales/                       # BookingController, SaleController (/bookings, /sales)
│   │   │   │   ├── finance/                     # FinanceController (/finance)
│   │   │   │   ├── service/                     # ServiceRecordController, FollowUpController (/service-records, /follow-ups)
│   │   │   │   ├── dashboard/                   # DashboardController (/dashboard/summary)
│   │   │   │   ├── reports/                     # ReportController (/reports)
│   │   │   │   └── documents/                   # DocumentController (/documents)
│   │   │   ├── dtos/                            # Immutable Request & Response Data Transfer Objects
│   │   │   ├── entity/                          # JPA Relational Entities
│   │   │   ├── enums/                           # 22 Domain Business Enums
│   │   │   ├── exception/                       # Custom Business Exceptions & GlobalExceptionHandler
│   │   │   ├── mapper/                          # MapStruct Mappers
│   │   │   ├── repository/                      # Spring Data JPA Repositories
│   │   │   ├── security/                        # JwtService, JwtAuthenticationFilter, PermissionService
│   │   │   ├── service/                         # Service Interfaces & Implementations
│   │   │   └── utils/storage/                   # Secure File Storage Service & Path Sanitization
│   │   └── resources/
│   │       ├── application.yml                  # Base configuration
│   │       ├── application-dev.yml              # Local MySQL development profile
│   │       ├── application-test.yml             # Self-contained H2 test profile
│   │       ├── application-prod.yml             # Production hardened profile
│   │       └── db/migration/
│   │           ├── V1__init_schema.sql          # Complete relational schema (28+ tables)
│   │           └── V2__seed_default_data.sql    # Seed data (Roles, Menus, Permissions, Baseline Parts)
│   └── test/
│       ├── java/com/ims/
│       │   ├── integration/                     # Spring Boot Integration Tests
│       │   ├── security/                        # Authorization & Permission Tests
│       │   └── unit/                            # Scenario Business Rule Unit Tests
│       └── resources/
│           └── application.yml                  # Test execution configuration
├── .env.example                                 # Environment variable template
├── .gitignore                                   # Git ignore rules
├── compose.yaml                                 # Docker Compose (MySQL 8.0 service)
├── Dockerfile                                   # Multi-stage container build
├── pom.xml                                      # Maven dependencies and build plugins
├── mvnw & mvnw.cmd                              # Maven Wrappers for Linux and Windows
└── README.md                                    # This document
```

---

## 7. Quickstart & Local Setup Guide

### 7.1 Prerequisites
- **JDK 21 LTS** installed (`java -version`).
- **MySQL 8.0** server running locally (or run via Docker Compose).
- **Git** and **Maven** (Maven wrapper `mvnw` is included).

### 7.2 Configuration Setup
Copy `.env.example` to `.env` or set environment variables:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dealership_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Security
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# File Storage
STORAGE_UPLOAD_DIR=uploads/
```

Create the MySQL database if not using Docker Compose:
```sql
CREATE DATABASE dealership_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 7.3 Build and Run Commands

#### Windows PowerShell:
```powershell
# Set Java Home if not already in system PATH
$env:JAVA_HOME = "C:\Program Files\JetBrains\PyCharm 2025.3.3\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Run all automated tests
.\mvnw.cmd test

# Build executable production JAR
.\mvnw.cmd clean package

# Run with development profile against MySQL
java -jar target/dealership-management-system-1.0.0.jar --spring.profiles.active=dev
```

#### Linux / macOS:
```bash
# Grant execution permissions to Maven wrapper
chmod +x ./mvnw

# Run automated tests
./mvnw test

# Build production JAR
./mvnw clean package

# Run application
java -jar target/dealership-management-system-1.0.0.jar --spring.profiles.active=dev
```

---

## 8. Docker Deployment

### Run MySQL & Application with Docker Compose:
```bash
# Start MySQL container
docker compose up -d mysql

# Build and start both MySQL and Backend
docker compose up --build -d
```

### Multi-Stage Docker Build:
```bash
docker build -t dealership-backend:1.0.0 .
docker run -p 8081:8081 --env-file .env dealership-backend:1.0.0
```

---

## 9. API Documentation & Swagger UI

Once the application is running, interact with the interactive OpenAPI documentation:

- **Swagger UI:** `http://localhost:8081/api/v1.0/swagger-ui.html`
- **OpenAPI JSON Spec:** `http://localhost:8081/api/v1.0/v3/api-docs`
- **Actuator Health:** `http://localhost:8081/api/v1.0/actuator/health`

### Initial Admin Credentials
Upon initial startup, `DataInitializer` securely provisions the default admin user:
- **Username:** `admin`
- **Default Password:** Configured via `app.admin.default-password` (default in dev: `admin123`)
- Authenticate via `POST /api/v1.0/auth/login` to obtain your Bearer access token.

---

## 10. Automated Testing Report

All 19 real automated unit and integration tests compile and pass with **0 failures and 0 errors**:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.ims.integration.DealershipIntegrationTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in DealershipIntegrationTest
[INFO] Running com.ims.security.AuthorizationTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in AuthorizationTest
[INFO] Running com.ims.unit.broker.BrokerSettlementTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in BrokerSettlementTest
[INFO] Running com.ims.unit.costing.VehicleCostingServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 -- in VehicleCostingServiceTest
[INFO] Running com.ims.unit.inventory.StockLedgerServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in StockLedgerServiceTest
[INFO] Running com.ims.unit.sales.SaleBusinessRulesTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 -- in SaleBusinessRulesTest
[INFO] Running com.ims.unit.vehicle.StatusWorkflowServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in StatusWorkflowServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

### Verified Test Scenarios:
1. **Scenario 1:** Own vehicle purchase ₹5,00,000 + expenses ₹10,000 + repairs ₹50,000 + accessories ₹20,000 = ₹5,80,000 cost. Sale at ₹7,50,000 generates ₹1,70,000 gross profit.
2. **Scenario 2:** Broker vehicle sold for ₹8,00,000 with basis ₹7,75,000 generates ₹25,000 gross commission.
3. **Scenario 3:** Broker repair ₹20,000 split ₹15,000 broker / ₹5,000 shop responsibility correctly counts only ₹5,000 as shop expense.
4. **Scenario 4:** Stock ledger: Inward 10 units, outward 1 unit $\to$ 9 units remaining (`10 - 1 = 9`). Insufficient stock throws `InsufficientStockException`.
5. **Scenario 5:** Fixed (₹25,000) and percentage (3% on ₹8,00,000 = ₹24,000) commission calculations.
6. **Scenario 6:** Partial broker settlements update remaining balance accurately. Overpayment is prevented.
7. **Scenario 7:** Selling an already sold or unavailable vehicle is rejected.
8. **Scenario 8:** Network retries with duplicate `idempotencyKey` return existing payment without double recording.
9. **Scenario 9:** Staff unauthorized access to broker settlements and administration is rejected.
10. **Scenario 10:** Direct sale delivery requires full payment; incomplete balance blocks vehicle delivery.
11. **Scenario 11:** Broker vehicles are isolated from purchased inventory.
12. **Scenario 12:** Costing and profit calculations reconcile across transaction records, dashboards, and reports.

---

## 11. Production Operations & Security Guidelines

1. **Secrets Management:** In production, override `JWT_SECRET`, database passwords, and initial credentials via external environment variables or AWS Secrets Manager / Vault. Never commit plain-text credentials.
2. **Database Migrations:** Flyway manages schema evolution. Ensure `spring.jpa.hibernate.ddl-auto=validate` remains active in production so Hibernate does not alter tables dynamically.
3. **Storage Security:** The file storage service generates non-guessable UUID file keys, validates MIME types and file extensions, and strictly prevents path traversal. In high-scale deployments, swap `StorageService` implementation to Amazon S3 without touching business logic.
4. **Database Backups:**
   ```bash
   mysqldump -u root -p --single-transaction --quick --routines dealership_db > backup_dealership_$(date +%F).sql
   ```

---

## 12. DEALEROS DMS Enterprise Frontend Architecture & Target Redesign

The user interface has been comprehensively redesigned to match the **DEALEROS DMS** reference aesthetic:
- **Design Tokens:** Charcoal navigation (`#242424`), Royal Blue primary actions (`#2868F5`), Light Gray workspace (`#F5F7FB`), White cards (`#FFFFFF`) with subtle borders (`#E5E7EB`), and compact high-density layout.
- **Reference 1: 15-Point Inspection Station (`/inspections/new`):** Categorized automotive systems (Powertrain, Undercarriage, Electrical & Cabin, Body & Cosmetics), interactive condition selectors (`GOOD`, `NEED_REPAIR`, `REPLACE`, `NOT_AVAILABLE`), real-time estimated repair cost, and live vehicle health score.
- **Reference 2: Vehicle Management (`/vehicles`):** Segmented tabs (`All Vehicles`, `Own Vehicles`, `Broker Vehicles`), "+ Add Own Vehicle" and "+ Add Broker Vehicle" action buttons, vehicle thumbnail preview with high-res zoom modal, and complete action suite (View, Edit, Inspect, Job Card, Costing).
- **Reference 3: Executive Business Dashboard (`/dashboard`):** Real-time KPI metrics, Quick Action bar (Add Vehicle, New Inspection, Create Job Card, Record Sale), actionable "Requires Immediate Attention" alerts, and responsive Recharts analytics.

### Full-Stack Quickstart Guide (Windows PowerShell)

#### Step 1: Start MySQL Database
Ensure MySQL 8.0 service is running:
```powershell
Get-Service MySQL80
```

#### Step 2: Start Spring Boot Backend
Open PowerShell in the project root:
```powershell
cd d:\dealershipManagementSystem
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```
Backend will be live at `http://localhost:8081/api/v1.0`.

#### Step 3: Start DEALEROS Frontend
Open a second PowerShell window:
```powershell
cd d:\dealershipManagementSystem\dealership-frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`.

#### Default Credentials:
- **Username:** `admin`
- **Password:** `admin123`
