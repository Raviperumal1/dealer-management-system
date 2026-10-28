# DEALEROS — Backend Architecture (Document 05)

## 1. Spring Boot Layered Architecture
The backend is built as an enterprise Spring Boot 3.4.2 application running on Java 21 LTS with strict architectural layering:

```text
HTTP Request
     │
     ▼
[SecurityFilterChain (CORS -> CSRF Disable -> JWT Auth Filter -> Exception EntryPoint)]
     │
     ▼
[DispatcherServlet (/api/v1.0)]
     │
     ▼
[Domain REST Controllers (@RestController)]
     │  (Jakarta @Valid Request DTO validation)
     ▼
[Business Service Layer (@Service, @Transactional)]
     │  (Enforces invariants, state machines, financial math, auditable actions)
     ▼
[MapStruct DTO-Entity Mappers]
     │
     ▼
[Spring Data JPA Repositories (Hibernate 6.6)]
     │
     ▼
[MySQL 8.0 Database (InnoDB)]
```

---

## 2. Security & Authentication Architecture

### 2.1 JWT Token Lifecycle
- **Algorithm**: HMAC SHA-256 (`jjwt` 0.12.6) using configured 256-bit secret `app.jwt.secret`.
- **Claims**: Subject (username), user ID, branch ID, and collection of authorities (`ROLE_ADMIN`, `ROLE_STAFF`, etc.).
- **Access Token**: Short-lived (default 24 hours).
- **Refresh Token**: Stored in `refresh_tokens` database table with revocation support, device fingerprinting, and expiry check.
- **Filter**: [`JwtAuthenticationFilter.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/security/jwt/JwtAuthenticationFilter.java) parses the `Authorization: Bearer <token>` header, verifies the signature, and sets the `SecurityContextHolder.getContext().setAuthentication(authentication)`.

### 2.2 Role-Based Access Control (RBAC)
- Built on dynamic permissions table:
  - `permissions` entity contains `menu_code` (e.g. `VEHICLES`, `SALES`, `FINANCE`), `can_view`, `can_add`, `can_edit`, `can_delete`.
  - Roles (`ROLE_ADMIN`, `ROLE_STAFF`, etc.) link to permissions via `role_permissions`.
  - Controllers use programmatic checks or `@PreAuthorize("hasRole('ADMIN')")`.

---

## 3. Transaction Management & Data Safety
- **Declarative Transactions**: Service implementation classes are annotated with `@Transactional(readOnly = true)` at the class level and `@Transactional` on state-altering methods (`confirmSale`, `recordPayment`, `receivePurchaseStock`, `closeLoan`).
- **Idempotency Keys**: Payment, purchase, and loan settlement requests accept an `idempotencyKey` field. If a duplicate request is received, the existing transaction record is returned safely without duplicate ledger debit/credit.
- **Auditing**: Base entities extend `AuditableEntity` with JPA entity listeners (`AuditingEntityListener`) automatically populating:
  - `created_at` (Timestamp)
  - `created_by` (Username of authenticated operator)
  - `updated_at` (Timestamp)
  - `updated_by` (Username)

---

## 4. Exception Handling Strategy ([`GlobalExceptionHandler.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/exception/GlobalExceptionHandler.java))
All uncaught application exceptions are intercepted into standard JSON responses:
```json
{
  "success": false,
  "errorCode": "BUSINESS_RULE_VIOLATION",
  "message": "Vehicle is already BOOKED and cannot be sold directly",
  "path": "/api/v1.0/sales",
  "timestamp": "2026-10-23T06:50:00Z",
  "fieldErrors": []
}
```
Mapped exceptions include:
- `MethodArgumentNotValidException` → HTTP 400 with itemized field constraint errors.
- `EntityNotFoundException` / `ResourceNotFoundException` → HTTP 404.
- `BusinessRuleViolationException` → HTTP 422 Unprocessable Entity.
- `BadCredentialsException` / `AuthenticationException` → HTTP 401.
- `AccessDeniedException` → HTTP 403 Forbidden.
- `Exception` (catch-all) → HTTP 500 Internal Server Error with sanitized error logging.
