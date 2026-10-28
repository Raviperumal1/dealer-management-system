# DEALEROS — Master Technical & Functional Documentation Reference (Document 15)

## 1. Master System Index
This document provides the definitive index and technical navigation map for the **DEALEROS** Enterprise Automotive Dealership Management System.

All generated technical analysis documents are located under [`docs/project-analysis/`](file:///d:/dealershipManagementSystem/docs/project-analysis/):

| Document | Title | Core Focus & Highlights |
| :--- | :--- | :--- |
| **[01_PROJECT_OVERVIEW.md](file:///d:/dealershipManagementSystem/docs/project-analysis/01_PROJECT_OVERVIEW.md)** | System Overview & Architecture | Tech stack (Spring Boot 3.4.2, Java 21, MySQL 8, React 18, Vite 6), directory tree, Docker configs, environment parameters. |
| **[02_SIDEBAR_AND_ROUTE_MAP.md](file:///d:/dealershipManagementSystem/docs/project-analysis/02_SIDEBAR_AND_ROUTE_MAP.md)** | Complete Sidebar & Route Inventory | Every parent and child menu item, exact URLs, components, RBAC permissions, and auto-expand logic. |
| **[03_MODULE_CATALOG.md](file:///d:/dealershipManagementSystem/docs/project-analysis/03_MODULE_CATALOG.md)** | Complete Module Catalog | Detailed breakdown of all 14 modules: Dashboard, Vehicles, Inspections, Job Cards, Inventory, Suppliers, Costing, Sales, Finance, Brokers, Customers, Service, Reports, Users. |
| **[04_FRONTEND_ARCHITECTURE.md](file:///d:/dealershipManagementSystem/docs/project-analysis/04_FRONTEND_ARCHITECTURE.md)** | Frontend Architecture | Redux Toolkit state, Axios interceptor, token rotation, design tokens, responsive tables, forms. |
| **[05_BACKEND_ARCHITECTURE.md](file:///d:/dealershipManagementSystem/docs/project-analysis/05_BACKEND_ARCHITECTURE.md)** | Backend Architecture | Spring Security chain, JWT lifecycle, transactional service boundaries, exception handlers, auditing. |
| **[06_DATABASE_SCHEMA_AND_RELATIONSHIPS.md](file:///d:/dealershipManagementSystem/docs/project-analysis/06_DATABASE_SCHEMA_AND_RELATIONSHIPS.md)** | Database Schema & Relationships | Flyway migrations `V1`–`V4`, ERD, table fields, data types, constraints, and relational mappings. |
| **[07_API_REFERENCE.md](file:///d:/dealershipManagementSystem/docs/project-analysis/07_API_REFERENCE.md)** | Complete API Inventory | 50+ REST endpoints, HTTP methods, controllers, schemas, permissions, and status codes. |
| **[08_END_TO_END_WORKFLOWS.md](file:///d:/dealershipManagementSystem/docs/project-analysis/08_END_TO_END_WORKFLOWS.md)** | End-to-End User Workflows | Step-by-step traces for Procurement, Reconditioning, Parts Purchasing, 3-Way Sales Execution, In-House EMI, Foreclosure, Delivery. |
| **[09_CROSS_MODULE_DEPENDENCIES.md](file:///d:/dealershipManagementSystem/docs/project-analysis/09_CROSS_MODULE_DEPENDENCIES.md)** | Cross-Module Dependencies | Interaction matrix, shared entities, event triggers, stock controls, and double-sale prevention. |
| **[10_BUSINESS_RULES_AND_CALCULATIONS.md](file:///d:/dealershipManagementSystem/docs/project-analysis/10_BUSINESS_RULES_AND_CALCULATIONS.md)** | Business Rules & Formulas | Exact mathematical formulations for compound reducing EMI, penny reconciliation, foreclosure quotes, broker commissions, landed vehicle costs. |
| **[11_AUTHENTICATION_AND_PERMISSIONS.md](file:///d:/dealershipManagementSystem/docs/project-analysis/11_AUTHENTICATION_AND_PERMISSIONS.md)** | Authentication & Permissions | BCrypt hashing, JWT tokens, dynamic menu-code permissions (`VIEW`, `ADD`, `EDIT`, `DELETE`). |
| **[12_TESTING_AND_VERIFICATION.md](file:///d:/dealershipManagementSystem/docs/project-analysis/12_TESTING_AND_VERIFICATION.md)** | Testing & Runtime Verification | Execution logs and proof for Maven compile, Spring Boot bootup, MySQL Flyway migrations, and Vite production bundle. |
| **[13_BUGS_AND_MISSING_FEATURES.md](file:///d:/dealershipManagementSystem/docs/project-analysis/13_BUGS_AND_MISSING_FEATURES.md)** | Bugs & Gap Analysis | Resolution of frontend client bugs, operational observations, and S3 storage recommendations. |
| **[14_IMPLEMENTATION_ROADMAP.md](file:///d:/dealershipManagementSystem/docs/project-analysis/14_IMPLEMENTATION_ROADMAP.md)** | Implementation Roadmap | Phased enhancements for WhatsApp/SMS notifications, RTO renewal tracking, and multi-branch tenancy. |

---

## 2. Summary Status
- **Backend**: Spring Boot 3.4.2 running on Java 21, port 8081 (`/api/v1.0`). Verified active with actuator `UP`.
- **Database**: MySQL 8.0 `dealership_db` synchronized with Flyway migrations `V1` through `V4`.
- **Frontend**: React 18 + Vite 6 Single Page Application compiled with zero errors (`dist/`).
- **Data Integrity**: Cleanly preserves all existing inventory, sales, customers, suppliers, and users without data loss or table drops.
