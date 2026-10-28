# System Architecture & Technical Specifications
## AutoManage Dealership Management System (DMS)

**Version:** 1.0.0 Enterprise  
**Baseline Date:** October 2026  
**Status:** Validated & Active

---

## 1. Architectural Overview

AutoManage DMS is an enterprise-grade, full-stack used-car and two-wheeler dealership management solution. It is architected as a decoupled, multi-tier Single Page Application (SPA) backed by a Spring Boot REST API and MySQL relational database.

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   React 18 + Vite SPA | Bootstrap 5.3 + Custom Tokens | Redux Toolkit | Recharts|
+---------------------------------------------------------------------------------+
                                      |
                                HTTPS / REST (JSON + Multipart Form-Data)
                                      |
+---------------------------------------------------------------------------------+
|                                BACKEND LAYER                                    |
|   Spring Boot 3.4.2 | Java 21 LTS | Embedded Tomcat 8081 | Context: /api/v1.0   |
|                                                                                 |
|   +-------------------+   +--------------------+   +------------------------+   |
|   | Spring Security   |   | REST Controllers   |   | Global Exception       |   |
|   | JWT Filter        |-->| (24 Controllers)   |-->| Handler Advice         |   |
|   +-------------------+   +--------------------+   +------------------------+   |
|                                     |                                           |
|   +-------------------------------------------------------------------------+   |
|   | Transactional Service Layer (Spring @Transactional, ACID enforcement)   |   |
|   | - VehicleService, WorkflowService, CostingService, SaleService          |   |
|   | - BrokerService, WorkshopService, InventoryService, DashboardService    |   |
|   +-------------------------------------------------------------------------+   |
|                                     |                                           |
|   +-------------------------------------------------------------------------+   |
|   | Data Access & Storage Layer                                             |   |
|   | - Spring Data JPA Repositories (Derived & HQL queries)                  |   |
|   | - Hibernate 6 ORM + Second-Level Cache Optimization                     |   |
|   | - Local File Storage Service (Path traversal protected, UUID keying)    |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
                                      |
                                JDBC (HikariCP)
                                      |
+---------------------------------------------------------------------------------+
|                                DATABASE LAYER                                   |
|   MySQL 8.0 Server | Database: dealership_db | Flyway Schema Migrations         |
|   - 28 Normalized Relational Tables | Foreign Key Constraints | Indices         |
+---------------------------------------------------------------------------------+
```

---

## 2. Technology Stack Specifications

### 2.1 Backend Technology Baseline
- **Runtime Environment:** Java 21 LTS (OpenJDK 64-Bit).
- **Core Framework:** Spring Boot 3.4.2.
- **Web Layer:** Spring Web MVC (`@RestController`), Jackson JSON 2.x.
- **Security:** Spring Security 6.x, JJWT (`io.jsonwebtoken:jjwt-api:0.12.6`), BCrypt Password Encoder.
- **Persistence:** Spring Data JPA, Hibernate 6.6, HikariCP Connection Pool (Max: 10, Min-Idle: 2).
- **Database Migrations:** Flyway 10.x with versioned SQL scripts.
- **Database:** MySQL Community Server 8.0+.
- **File Storage:** Configurable filesystem storage (`app.storage.upload-dir: uploads/`) with MIME/Extension validation.
- **API Documentation:** Springdoc OpenAPI 2.8.3 / Swagger UI (`/api/v1.0/swagger-ui.html`).
- **Build System:** Apache Maven 3.9+ via Maven Wrapper (`mvnw.cmd`).

### 2.2 Frontend Technology Baseline
- **Runtime Environment:** Node.js 18+ / 20+ LTS.
- **Framework:** React 18.3.1.
- **Build Tool:** Vite 6.1.0 with Rollup bundler and ES modules.
- **State Management:** Redux Toolkit 2.5.1 (`@reduxjs/toolkit`), `react-redux` 9.2.0.
- **Routing:** React Router DOM 6.28.2 (Browser Router with Protected / Role-based guards).
- **HTTP Client:** Axios 1.7.9 with request interceptors (JWT attachment, param sanitization) and response interceptors (automatic token refresh, queue replay).
- **Form Handling & Validation:** React Hook Form 7.54.2 with Zod 3.24.2 resolvers (`@hookform/resolvers`).
- **UI Framework & Design Tokens:** Bootstrap 5.3.3 supplemented with automotive dashboard design tokens.
- **Icons:** Lucide React 0.475.0.
- **Data Visualizations:** Recharts 2.15.1 (Bar charts, Donut charts, responsive containers).
- **Testing:** Vitest 3.0.5 with jsdom 26.0.0 and `@testing-library/react` 16.2.0.

---

## 3. Database Schema Architecture

The relational schema is divided into 10 cohesive domain groupings:

1. **Security & RBAC:** `users`, `roles`, `user_roles`, `menus`, `role_menu_permissions`, `refresh_tokens`, `password_reset_tokens`.
2. **Vehicles & Lifecycle:** `vehicles`, `vehicle_purchases`, `vehicle_documents`, `vehicle_photos`, `vehicle_status_history`.
3. **Brokers & Consignment:** `brokers`, `broker_vehicle_listings`, `broker_commissions`, `broker_settlements`, `broker_settlement_payments`.
4. **Workshop & Inspection:** `inspections`, `inspection_items`, `job_cards`, `job_card_items`, `job_card_parts`, `job_card_labour`.
5. **Inventory & Suppliers:** `suppliers`, `parts`, `purchase_invoices`, `purchase_invoice_items`, `stock_movements`.
6. **Vehicle Costing & Expenses:** `vehicle_costs`, `shop_expenses`.
7. **Customers & Booking:** `customers`, `bookings`.
8. **Sales & Deliveries:** `sales`, `payments`, `deliveries`.
9. **Vehicle Financing:** `finance_details`, `emi_schedules`.
10. **After-Sales Service:** `service_records`, `service_parts`, `service_follow_ups`, `audit_logs`.

---

## 4. Storage Architecture & Image Persistence

Vehicle photos and documents are stored persistently on the host filesystem:
- **Directory Location:** `d:/dealershipManagementSystem/uploads/` (Configurable via `STORAGE_UPLOAD_DIR`).
- **File Naming Strategy:** Cryptographically secure UUIDs (`UUID.randomUUID().toString() + "." + extension`).
- **Security Protections:**
  - Strict path traversal prevention: rejects filenames containing `..`, `/`, `\`.
  - Whitelisted file extensions: `jpg`, `jpeg`, `png`, `webp`, `pdf`.
  - Validated MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Content length restriction: Max 10MB per file, Max 15MB per request.
- **Retrieval Mechanism:**
  - Streaming Spring `Resource` via `/api/v1.0/documents/{fileKey}/download`.
  - Public read permission enabled in `SecurityConfig` to ensure browser `<img>` tags load seamlessly without requiring Authorization header injection.
