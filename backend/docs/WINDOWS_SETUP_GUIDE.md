# Windows PowerShell Setup & Operations Guide
## AutoManage Pro DMS — Used Car & Bike Dealership Management System

This comprehensive setup guide explains how to install, configure, verify, test, and run both the Java Spring Boot backend and the React frontend on Windows PowerShell.

---

## 1. System Prerequisites

Ensure the following runtimes and tools are installed and present in your Windows `PATH`:

| Requirement | Minimum Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- |
| **Java Development Kit (JDK)** | OpenJDK 21 LTS | `java -version` | Oracle JDK or Eclipse Temurin 21 |
| **Node.js & npm** | Node v18+ (Node v20 LTS recommended) | `node -v` ; `npm -v` | JavaScript runtime & package manager |
| **MySQL Server** | MySQL Community Server 8.0+ | `mysql -V` | Local service running on port `3306` |
| **Git** | 2.30+ | `git --version` | Source control |
| **PowerShell** | PowerShell 5.1 or PowerShell 7+ | `$PSVersionTable.PSVersion` | Windows Terminal recommended |

---

## 2. MySQL Database Setup

The backend expects a MySQL 8 database named `dealership_db`.

### Step 2.1: Open Windows PowerShell and connect to MySQL
```powershell
mysql -u root -p
```
*(Enter your MySQL root password when prompted)*

### Step 2.2: Create the Database with UTF-8 Support
```sql
CREATE DATABASE IF NOT EXISTS dealership_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Verify database creation:
SHOW DATABASES LIKE 'dealership_db';
EXIT;
```

---

## 3. Environment & Configuration

### Backend Configuration (`src/main/resources/`)
The Spring Boot backend uses `application.yml` and `application-dev.yml`. You can either rely on default dev properties or customize them via environment variables:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SERVER_PORT` | `8081` | Spring Boot HTTP server port |
| `API_PREFIX` | `/api/v1.0` | Global servlet context path |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev`, `prod`, `test`) |
| `DB_HOST` | `localhost` | MySQL host address |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `dealership_db` | MySQL schema name |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | `Ravi@1234` | Database password *(customize for your local MySQL)* |
| `JWT_SECRET` | `404E635266556...` | 256-bit HMAC-SHA256 signing secret |
| `JWT_EXPIRATION_MS` | `86400000` | 24 hours (Access Token) |
| `STORAGE_UPLOAD_DIR` | `uploads/` | Local directory for vehicle images & PDFs |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:3000,http://localhost:5173` | Allowed frontend origins |

*(Optional)* In PowerShell, set custom environment variables before launching if different from defaults:
```powershell
$env:DB_PASSWORD="YourMySqlPassword"
$env:SERVER_PORT="8081"
```

### Frontend Configuration (`dealership-frontend/.env`)
Navigate to `dealership-frontend/.env` (or copy from `.env.example`):
```ini
# API Base URL for Spring Boot backend
VITE_API_BASE_URL=http://localhost:8081/api/v1.0
VITE_APP_NAME="AutoManage Pro Enterprise DMS"
```

---

## 4. Flyway Database Migrations

Database schema creation and baseline seeding are managed automatically by **Flyway** on application startup:
- Migration scripts: `src/main/resources/db/migration/V1__init_schema.sql` through `V4__seed_comprehensive_demo_data.sql`.
- Baseline seed data includes default admin and staff credentials, suppliers, parts inventory, sample cars, bikes, job cards, customers, bookings, and broker records.

No manual `.sql` script execution is required. Simply starting the backend triggers Flyway automatically.

---

## 5. Starting the Backend Server

Open a Windows PowerShell terminal in the project root:

```powershell
# Navigate to the workspace root
cd d:\dealershipManagementSystem

# Build and start Spring Boot with Maven Wrapper
.\mvnw.cmd spring-boot:run
```

When started successfully, the console will output:
```text
Started DealershipManagementSystemApplication in X.XXX seconds
Tomcat started on port 8081 (http) with context path '/api/v1.0'
```

### Health Check & OpenAPI Documentation
- **Health Check:** [http://localhost:8081/api/v1.0/actuator/health](http://localhost:8081/api/v1.0/actuator/health)
- **Swagger UI:** [http://localhost:8081/api/v1.0/swagger-ui.html](http://localhost:8081/api/v1.0/swagger-ui.html)
- **OpenAPI v3 JSON:** [http://localhost:8081/api/v1.0/v3/api-docs](http://localhost:8081/api/v1.0/v3/api-docs)

---

## 6. Starting the React Frontend

Open a second Windows PowerShell terminal:

```powershell
# Navigate to the frontend directory
cd d:\dealershipManagementSystem\dealership-frontend

# Install dependencies (only required on first setup)
npm install

# Start Vite Development Server
npm run dev
```

The Vite dev server will launch at:
- **Local Application URL:** [http://localhost:5173](http://localhost:5173)

---

## 7. User Authentication & Default Accounts

The system initializes with two pre-configured, bcrypt-hashed accounts for immediate client demonstration:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | Full administrative access across all modules: Inventory, Job Cards, Costing, Sales, Finance, Broker Settlements, Users, and Reports. |
| **Sales & Workshop Staff** | `staff` | `StaffSecure@2026!` | Operational access: Vehicle inventory, Inspection, Job Cards, Bookings, Customers, and Invoicing. |

*(The Login screen features single-click "Fill Demo Admin" and "Fill Demo Staff" quick-buttons for convenience during client presentations).*

---

## 8. Vehicle Image & Document Storage

Vehicle photos and RC/Insurance documents are stored locally in the `uploads/` directory at the project root:
1. **Uploads Folder:** Automatically created by `LocalFileStorageService` if it does not already exist.
2. **File Streaming Endpoint:** Publicly streamable via `GET /api/v1.0/documents/{fileKey}` (whitelisted in `SecurityConfig.java` to support standard browser `<img>` rendering).
3. **Upload Endpoints:** 
   - `POST /api/v1.0/vehicles/{id}/photos` (Multi-part form file, caption, primary flag).
   - `POST /api/v1.0/vehicles/{id}/documents` (PDF/Image file, document type).
4. **Persistence Guarantee:** Images remain persistent on disk across application restarts and database reboots.

---

## 9. Automated Testing Execution

### Backend Tests (JUnit 5 + Spring Boot Test + H2 In-Memory)
Run backend integration and unit tests:
```powershell
cd d:\dealershipManagementSystem
.\mvnw.cmd test
```
*Expected Result:* **19 tests run, 0 failures, 0 errors (BUILD SUCCESS)**.

### Frontend Tests (Vitest + React Testing Library)
Run frontend component and utility unit tests:
```powershell
cd d:\dealershipManagementSystem\dealership-frontend
npm test
```
*Expected Result:* **10 tests run, 10 passed (Test Files 2 passed)**.

---

## 10. Production Build Verification

### Backend Production Jar
```powershell
cd d:\dealershipManagementSystem
.\mvnw.cmd clean package -DskipTests
```
Generates executable archive: `target/dealership-management-system-0.0.1-SNAPSHOT.jar`.
Run via:
```powershell
java -jar target\dealership-management-system-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### Frontend Production Bundle
```powershell
cd d:\dealershipManagementSystem\dealership-frontend
npm run build
```
Generates production-optimized static assets in `dealership-frontend/dist/`.

---

## 11. Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`CommunicationsException: Communications link failure`** | MySQL Server is not running or incorrect port/credentials. | Run `net start MySQL80` or verify credentials in `application-dev.yml` (`root` / `Ravi@1234`). |
| **`Port 8081 already in use`** | A prior Spring Boot process is still running. | Run `Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess \| Stop-Process -Force` in PowerShell. |
| **`FlywayValidateException: Validate failed`** | A migration file was edited after being applied. | Run `mysql -u root -p -e "DROP DATABASE dealership_db; CREATE DATABASE dealership_db;"` to reapply clean baseline. |
| **Vehicle photo returns 401 Unauthorized** | Browser `<img>` tag cannot send `Authorization` header. | Verify `SecurityConfig.java` has `.requestMatchers(HttpMethod.GET, "/documents/**").permitAll()`. *(Already fixed & verified)*. |
| **CORS Policy Error in Browser Console** | Backend does not allow port 5173. | Ensure `application.yml` has `http://localhost:5173` in `cors.allowed-origins`. *(Already configured)*. |
