# DEALEROS — System Overview & Architecture (Document 01)

## 1. Executive Summary
**DEALEROS** is a production-grade, enterprise-class Used Car & Two-Wheeler Dealership Management System (DMS) built specifically for the Indian automotive market. The system manages the complete lifecycle of vehicle acquisition (Direct purchase & Broker consignment), multi-point inspection, workshop reconditioning, spare parts purchasing & inventory, cost aggregation, customer bookings, sales contract execution (Direct, In-House EMI, External Bank/NBFC Finance), delivery gatepass issuance, service history, and gross margin analytics.

---

## 2. Technology Stack & Versions

| Layer | Technology | Version | Key Libraries / Modules |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Spring Boot | 3.4.2 | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `spring-boot-starter-actuator` |
| **Language (Backend)** | Java | 21 (LTS) | Modern Java with records, pattern matching, switch expressions, Virtual Threads capability |
| **Database Engine** | MySQL | 8.0+ | InnoDB storage engine, UTF-8 unicode encoding, strict mode, timezone UTC |
| **Database Migrations**| Flyway | 10.x | `flyway-core`, `flyway-mysql` managing sequential migrations in `classpath:db/migration` |
| **Build Tool (Backend)**| Maven Wrapper | 3.9+ | `pom.xml` with `mapstruct` (1.6.3), `lombok` (1.18.36), `jjwt` (0.12.6), `springdoc-openapi` (2.8.5), Apache POI (5.4.0), OpenPDF (2.0.3) |
| **Frontend Framework**| React | 18.3.1 | Functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) |
| **Frontend Bundler** | Vite | 6.1.0 | Fast HMR, code-splitting, Rollup-based production chunking in `vite.config.js` |
| **Routing** | React Router DOM | 6.28.2 | `createBrowserRouter`, data routing, nested routes, route error boundaries, permission guards |
| **State Management** | Redux Toolkit | 2.5.1 | `@reduxjs/toolkit` and `react-redux` (9.2.0) managing Auth slice and UI toast/sidebar slices |
| **UI Styling** | Bootstrap & Custom CSS| 5.3.3 | Responsive grid, clean cards, table helpers, custom CSS design tokens (`styles/`, `index.css`) |
| **Icons** | Lucide React | 0.475.0 | Modern SVG icon set |
| **Charts & Analytics**| Recharts | 2.15.1 | Responsive bar charts, line trends, and donut charts for showroom analytics |
| **Date Formatting** | date-fns | 3.6.0 | Standardized Indian date and timestamp formatting (`dd/MM/yyyy`, `dd MMM yyyy`) |
| **Testing** | Vitest & JUnit 5 | Vitest 3.0.5 / JUnit 5.11 | Vitest + Testing Library for React; Spring Boot Starter Test + Mockito + Testcontainers for Backend |

---

## 3. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client Browser
        UI[React 18 SPA (Vite)]
        Router[React Router 6]
        Redux[Redux Toolkit Store]
        ApiClient[Axios API Client + Interceptor]
    end

    subgraph Spring Boot 3.4.2 API Layer (Port 8081 /api/v1.0)
        SecFilter[JwtAuthenticationFilter + SecurityFilterChain]
        Dispatch[Spring DispatcherServlet]
        Controllers[20+ Domain REST Controllers]
        Services[Transactional Service Layer]
        Mappers[MapStruct DTO-Entity Mappers]
        Audit[AuditingEntityListener + Username Context]
    end

    subgraph Persistence & File Storage
        Flyway[Flyway Migration Engine]
        JPA[Hibernate 6.6 / Spring Data JPA]
        MySQL[(MySQL 8.0 Database)]
        LocalStorage[Local Document Storage (uploads/)]
    end

    UI --> Router
    Router --> Redux
    Router --> ApiClient
    ApiClient -- JWT Bearer over HTTP/JSON --> SecFilter
    SecFilter --> Dispatch
    Dispatch --> Controllers
    Controllers --> Services
    Services --> Mappers
    Services --> Audit
    Services --> JPA
    Flyway --> MySQL
    JPA --> MySQL
    Services --> LocalStorage
```

---

## 4. Repository & Directory Structure

```text
dealershipManagementSystem/
├── pom.xml                               # Backend dependencies, compiler args, plugins
├── mvnw / mvnw.cmd                       # Maven cross-platform wrappers
├── compose.yaml                          # Docker compose for MySQL 8 local container
├── Dockerfile                            # Multi-stage container build for Spring Boot application
├── uploads/                              # Default local filesystem directory for vehicle & ID documents
├── src/
│   ├── main/
│   │   ├── java/com/ims/
│   │   │   ├── DealershipManagementSystemApplication.java   # Spring Boot entry point (@SpringBootApplication)
│   │   │   ├── config/                   # SecurityConfig, CorsConfig, OpenApiConfig, DataInitializer
│   │   │   ├── controller/               # 20 REST controllers categorized by domain
│   │   │   ├── dtos/                     # Data Transfer Objects with Jakarta validation annotations
│   │   │   ├── entity/                   # JPA Entity definitions with Hibernate mappings
│   │   │   ├── enums/                    # Strong domain enumerations (VehicleStatus, SaleType, etc.)
│   │   │   ├── exception/                # GlobalExceptionHandler & custom BusinessRuleViolationExceptions
│   │   │   ├── mapper/                   # MapStruct interfaces for clean model transformation
│   │   │   ├── repository/               # Spring Data JPA repositories
│   │   │   ├── security/                 # JWT token provider, AuthEntryPoint, UserPrincipal
│   │   │   ├── service/                  # Business logic interfaces & implementation classes
│   │   │   └── utils/                    # Storage helpers, sequence generators, currency formatters
│   │   └── resources/
│   │       ├── application.yml           # Base Spring configuration (JWT secrets, storage, OpenAPI)
│   │       ├── application-dev.yml       # Local dev MySQL datasource configuration
│   │       ├── application-prod.yml      # Production environment configuration
│   │       └── db/migration/             # Sequential Flyway SQL migrations (V1 to V4)
├── dealership-frontend/
│   ├── package.json                      # Frontend dependencies, scripts, devDependencies
│   ├── vite.config.js                    # Vite bundler configuration & dev server proxy
│   ├── index.html                        # Single Page Application HTML root
│   └── src/
│       ├── main.jsx                      # React mounting root with Redux Provider
│       ├── app/
│       │   ├── App.jsx                   # App container with RouterProvider and ToastContainer
│       │   ├── router.jsx                # Complete route definitions, permission guards, code-splitting
│       │   └── store.js                  # Redux Toolkit store (authSlice, uiSlice)
│       ├── components/
│       │   ├── common/                   # DataTable, PageHeader, MoneyDisplay, StatusBadge, ConfirmDialog
│       │   └── layout/                   # AppLayout, Sidebar, Navbar, MobileMenu
│       ├── features/                     # 22 feature folders matching dealership business domains
│       ├── routes/                       # ProtectedRoute, PermissionRoute, PublicRoute guards
│       ├── services/                     # 16 Axios client modules mapping to backend REST endpoints
│       ├── styles/                       # CSS design tokens, custom components, typography
│       └── utils/                        # Currency formatters, Indian phone & registration formatters
└── docs/
    └── project-analysis/                 # Technical and functional documentation suite
```

---

## 5. Configuration & Environment Variables

| Variable Name | Default Value | Purpose | Sensitive? |
| :--- | :--- | :--- | :--- |
| `SERVER_PORT` | `8081` | Spring Boot HTTP listening port | No |
| `API_PREFIX` | `/api/v1.0` | Global servlet context path | No |
| `SPRING_PROFILES_ACTIVE`| `dev` | Active Spring profile (`dev`, `prod`, `test`) | No |
| `DB_HOST` | `localhost` | MySQL database host | No |
| `DB_PORT` | `3306` | MySQL database port | No |
| `DB_NAME` | `dealership_db` | Primary dealership database schema | No |
| `DB_USERNAME` | `root` | Database connection username | Yes |
| `DB_PASSWORD` | Configured in dev/prod | Database connection password | Yes |
| `JWT_SECRET` | 256-bit Hex Key | HMAC SHA-256 signing secret for Auth JWT tokens | Yes |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | Access token validity window | No |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7d) | Refresh token validity window | No |
| `STORAGE_UPLOAD_DIR` | `uploads/` | Server filesystem path for uploads | No |
| `MAX_FILE_SIZE` | `10MB` | Multipart upload maximum individual file limit | No |
| `MAX_REQUEST_SIZE`| `15MB` | Multipart upload total request size limit | No |

---

## 6. Build & Execution Procedures

### 6.1 Backend
- **Compile & Validate**:
  ```powershell
  .\mvnw.cmd compile
  ```
- **Run Application Locally**:
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```
- **Access Swagger / OpenAPI UI**:
  `http://localhost:8081/api/v1.0/swagger-ui.html`

### 6.2 Frontend
- **Install Dependencies**:
  ```powershell
  cd dealership-frontend
  npm install
  ```
- **Run Vite Dev Server**:
  ```powershell
  npm run dev
  ```
- **Compile Production Bundle**:
  ```powershell
  npm run build
  ```
