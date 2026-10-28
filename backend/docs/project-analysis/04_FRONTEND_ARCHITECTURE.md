# DEALEROS — Frontend Architecture (Document 04)

## 1. Single Page Application Architecture
The frontend is built on **React 18** with **Vite 6** providing fast sub-second HMR and optimized production Rollup chunks. It uses standard functional components, hooks, and clean layer separation.

```text
dealership-frontend/src/
├── app/                  # Application initialization, root store, router definition
├── components/           # Reusable generic UI components (DataTable, PageHeader, Modal)
├── features/             # Business modules grouped by functional subdomain
├── hooks/                # Reusable custom hooks (usePagination, usePermission, useDebounce)
├── routes/               # Route guard components (ProtectedRoute, PermissionRoute, PublicRoute)
├── services/             # Axios API client instances mapping to backend REST endpoints
├── styles/               # CSS design system, Bootstrap 5 customizations, tokens
└── utils/                # Pure formatting utility functions (currency, phone, dates)
```

---

## 2. State Management Architecture
The application uses a hybrid state approach:
1. **Global Application State (Redux Toolkit - `store.js`)**:
   - `authSlice.js`:
     - Stores JWT `token`, `refreshToken`, and user object (`id`, `username`, `fullName`, `roles`, `permissions`).
     - Reads and writes to `localStorage` under `token`, `refreshToken`, and `user`.
     - Handles logout clearing credentials.
   - `uiSlice.js`:
     - `sidebarCollapsed`: Controls desktop sidebar width (260px vs 72px).
     - `mobileSidebarOpen`: Controls mobile off-canvas drawer open/close.
     - `toasts`: Centralized non-blocking toast notification stack supporting `success`, `error`, `warning`, `info`.
2. **Local Component & Form State**:
   - Uses React standard `useState` and `useEffect` for page-level data fetching, tabular pagination, sorting, search debounce, and modal triggers.
   - For complex multi-field inputs, uses controlled inputs with validation states or `react-hook-form` with `zod` resolvers.

---

## 3. API Client & HTTP Interceptors ([`apiClient.js`](file:///d:/dealershipManagementSystem/dealership-frontend/src/services/apiClient.js))
All backend communication is centralized in an Axios instance configured with:
- **Base URL**: `/api/v1.0` (proxied in `vite.config.js` to `http://localhost:8081` during development).
- **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from Redux/localStorage to every outgoing request.
- **Response Interceptor (Token Refresh & Error Unification)**:
  - If a request returns HTTP `401 Unauthorized`, interceptor queues requests and attempts automatic refresh token rotation via `/auth/refresh`.
  - If refresh fails or token is expired, dispatches logout action, cleans storage, and redirects to `/login`.
  - Normalizes Spring Boot error responses (`response.data.message` or `response.data.errors`) into standard Javascript Error instances.

---

## 4. Design System & Tokens
- **CSS Framework**: Bootstrap 5.3.3 combined with custom CSS utility classes.
- **Color Palette & Visual Tokens**:
  - Primary Brand: Modern Royal Blue (`#2868F5` to `#1D52C7`)
  - Success / Income: Emerald (`#10B981` / `#059669`)
  - Warning / In-Progress: Amber (`#F59E0B` / `#D97706`)
  - Danger / Overdue: Crimson (`#EF4444` / `#DC2626`)
  - Info / Sanctioned: Cyan / Sky (`#06B6D4` / `#0284C7`)
  - Surfaces: Clean White (`#FFFFFF`) with light border lines (`rgba(0, 0, 0, 0.08)`) and slate headers (`#111827`).
- **Typography**: Clean system sans-serif hierarchy with monospaced accents for Registration numbers, Engine/Chassis VINs, UTR transaction references, and currency amounts.
- **Component Primitives**:
  - `DataTable.jsx`: Responsive data grid supporting server-side sort, pagination, empty states, loading skeleton, and custom cell renders.
  - `PageHeader.jsx`: Standardized title, subtitle, breadcrumb trail, and top-right primary action buttons.
  - `MoneyDisplay.jsx`: Formats amounts using Indian numbering system (`₹1,50,000.00`).
  - `StatusBadge.jsx`: Unified badge colors mapped to domain status enums.
  - `ConfirmDialog.jsx`: Accessible modal ensuring safe user confirmation before financial posting or destructive operations.
