# Feature Gap Report & Actionable Remediation Plan
## Used Car & Bike Dealership Management System

**Assessment Date:** October 2026  
**Status:** In Progress / High Priority Remediation

---

## 1. Feature Gap Summary & Priority Hierarchy

To transform the current codebase into a demonstration-grade product, gaps are grouped into three priority tiers:

- **Priority A (Critical Client Demonstration Blockers):**
  1. Vehicle Photo Upload, Primary Toggle, Deletion, and Persistent Storage.
  2. Public image streaming endpoint in Spring Security configuration so `<img>` tags load without 401.
  3. Vehicle Document (RC, Insurance, Pollution) upload and download.
  4. Top-level property alignment on `VehicleResponse` (`sellingPrice`, `type`, `ownership`, `odometerKm`).
  5. Vehicle List and Details UI photo gallery, thumbnail rendering, and dropzone components.
  6. Demo credentials password synchronization in login screen.
- **Priority B (High Value Business Enhancements):**
  1. Visual indicator of low-stock thresholds in Parts inventory with reorder recommendations.
  2. Automated reminder card badges on Dashboard for overdue EMI installments and service follow-ups.
  3. Export button confirmation and instant CSV/PDF generation feedback.
- **Priority C (Optional Advanced Intelligence):**
  1. Rule-based vehicle pricing recommendations based on year, mileage, and historical brand margins.
  2. Automated customer service follow-up scheduling on sale completion.

---

## 2. Detailed Remediation Plan

### Remediation Item 1: Vehicle Photo & Document Endpoints (Backend)
- **Target File:** `src/main/java/com/ims/controller/vehicle/VehicleController.java` & `src/main/java/com/ims/service/impl/vehicle/VehicleServiceImpl.java`
- **Actions:**
  - Add `POST /vehicles/{id}/photos` supporting multipart file, caption, and primary flag.
  - Add `PATCH /vehicles/{id}/photos/{photoId}/primary` to atomically switch the primary vehicle thumbnail.
  - Add `DELETE /vehicles/{id}/photos/{photoId}` to remove photos.
  - Add `POST /vehicles/{id}/documents` to associate RC/Insurance PDFs with vehicle.
  - Add `DELETE /vehicles/{id}/documents/{docId}`.

### Remediation Item 2: Public Media Streaming Authorization (Backend)
- **Target File:** `src/main/java/com/ims/config/SecurityConfig.java` & `src/main/java/com/ims/controller/documents/DocumentController.java`
- **Actions:**
  - Whitelist `/documents/**` for GET requests in `SecurityFilterChain`.
  - Remove `@PreAuthorize("isAuthenticated()")` from `downloadFile(String fileKey)` in `DocumentController`.
  - Ensure `downloadFile` handles both UUID filenames and numeric document IDs gracefully.

### Remediation Item 3: DTO Contract Alignment (Backend)
- **Target File:** `src/main/java/com/ims/dtos/vehicle/VehicleResponse.java` & `src/main/java/com/ims/mapper/VehicleMapper.java`
- **Actions:**
  - Add `sellingPrice`, `type`, `ownership`, `odometerKm` fields to `VehicleResponse`.
  - Populate `sellingPrice` intelligently: for Broker vehicles from `listing.expectedSellingPrice`, for Own vehicles from `purchase.purchasePrice` (or target selling price).

### Remediation Item 4: Frontend Vehicle Photo Gallery & Dropzone Component
- **Target File:** `dealership-frontend/src/components/vehicle/VehiclePhotoGallery.jsx` & `VehicleDocumentManager.jsx`
- **Actions:**
  - Create reusable, accessible Bootstrap + Lucide photo gallery.
  - Support instant image preview, progress bar, file size validation, primary badge, and delete confirmation.
  - Mount this component in `VehicleDetailPage.jsx` and enable photo upload in `VehicleFormPage.jsx`.

### Remediation Item 5: Thumbnail Display on Inventory Lists
- **Target File:** `dealership-frontend/src/features/vehicles/VehicleListPage.jsx` & `AvailableVehiclesPage.jsx`
- **Actions:**
  - Replace placeholder icon with vehicle `primaryPhotoUrl` when available, falling back gracefully to the Car/Bike icon.
