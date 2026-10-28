# API Integration Matrix
## Comprehensive End-to-End Contract Verification

All backend endpoints are rooted at `/api/v1.0`. The table below documents the complete contract, request/response structures, authorization rules, frontend service calls, and verification status.

---

| HTTP Method | API Endpoint | Description | Request Payload | Response Schema | Required Permission | Frontend Service & Route | Status |
|---|---|---|---|---|---|---|---|
| **POST** | `/auth/login` | Authenticate user & issue JWT | `LoginRequest` (username, password) | `ApiResponse<LoginResponse>` (token, refreshToken, user, roles) | Public (PermitAll) | `authService.login` (`/login`) | **PASS** |
| **POST** | `/auth/refresh` | Rotate expired access token | `RefreshTokenRequest` (refreshToken) | `ApiResponse<LoginResponse>` | Public (PermitAll) | `apiClient` Axios Interceptor | **PASS** |
| **POST** | `/auth/logout` | Revoke tokens & terminate session | None (Bearer Header) | `ApiResponse<Void>` | Authenticated | `authService.logout` (Header) | **PASS** |
| **POST** | `/auth/change-password` | Update user password | `ChangePasswordRequest` (old, new) | `ApiResponse<Void>` | Authenticated | `authService.changePassword` (`/profile`) | **PASS** |
| **GET** | `/users/me` | Fetch active user profile & menu permissions | None | `ApiResponse<UserProfileResponse>` | Authenticated | `userService.getCurrentProfile` | **PASS** |
| **GET** | `/users` | List users with pagination | Query: page, size, role | `ApiResponse<PageResponse<UserResponse>>` | `ADMIN:VIEW` | `userService.getAllUsers` (`/users`) | **PASS** |
| **POST** | `/users` | Create new staff / admin user | `UserCreateRequest` | `ApiResponse<UserResponse>` | `ADMIN:ADD` | `userService.createUser` (`/users`) | **PASS** |
| **PATCH** | `/users/{id}/deactivate` | Toggle active status | None | `ApiResponse<UserResponse>` | `ADMIN:EDIT` | `userService.deactivateUser` (`/users`) | **PASS** |
| **GET** | `/roles` | List all system roles | None | `ApiResponse<List<RoleResponse>>` | `ADMIN:VIEW` | `userService.getAllRoles` (`/roles`) | **PASS** |
| **GET** | `/roles/{id}/permissions` | Retrieve menu permission matrix for role | None | `ApiResponse<List<RoleMenuPermissionResponse>>` | `ADMIN:VIEW` | `userService.getRolePermissions` (`/roles`) | **PASS** |
| **PUT** | `/roles/{id}/permissions` | Update role menu permissions | `RolePermissionUpdateRequest` | `ApiResponse<List<RoleMenuPermissionResponse>>` | `ADMIN:EDIT` | `userService.updateRolePermissions` (`/roles`) | **PASS** |
| **GET** | `/vehicles` | Paginated vehicle inventory with filters | Query: page, size, type, ownership, status, search | `ApiResponse<PageResponse<VehicleResponse>>` | `VEHICLES:VIEW` | `vehicleService.getAllVehicles` (`/vehicles`) | **PASS** |
| **GET** | `/vehicles/available` | Filter available showroom stock | Query: page, size, type, ownership, brand, search | `ApiResponse<PageResponse<VehicleResponse>>` | `VEHICLES:VIEW` | `vehicleService.getAvailableVehicles` (`/vehicles/available`) | **PASS** |
| **POST** | `/vehicles` | Register new Own or Broker vehicle | `VehicleCreateRequest` | `ApiResponse<VehicleResponse>` | `VEHICLES:ADD` | `vehicleService.createVehicle` (`/vehicles/new`) | **PASS** |
| **GET** | `/vehicles/{id}` | Complete vehicle detail & specs | Path: id | `ApiResponse<VehicleResponse>` | `VEHICLES:VIEW` | `vehicleService.getVehicleById` (`/vehicles/:id`) | **PASS** |
| **PUT** | `/vehicles/{id}` | Update vehicle specifications | `VehicleUpdateRequest` | `ApiResponse<VehicleResponse>` | `VEHICLES:EDIT` | `vehicleService.updateVehicle` (`/vehicles/:id/edit`) | **PASS** |
| **PATCH** | `/vehicles/{id}/status` | Validated lifecycle transition | `VehicleStatusUpdateRequest` | `ApiResponse<VehicleResponse>` | `VEHICLES:STATUS` | `vehicleService.updateVehicleStatus` (`/vehicles/:id`) | **PASS** |
| **GET** | `/vehicles/{id}/history` | Audit log of status transitions | Path: id | `ApiResponse<List<VehicleHistoryResponse>>` | `VEHICLES:VIEW` | `vehicleService.getVehicleHistory` (`/vehicles/:id`) | **PASS** |
| **POST** | `/vehicles/{id}/photos` | Upload vehicle photograph | MultipartFile (file, caption, isPrimary) | `ApiResponse<VehicleResponse>` | `VEHICLES:EDIT` | `vehicleService.uploadPhoto` (`/vehicles/:id`) | **PASS** |
| **PATCH** | `/vehicles/{id}/photos/{photoId}/primary` | Designate primary vehicle photo | None | `ApiResponse<VehicleResponse>` | `VEHICLES:EDIT` | `vehicleService.setPrimaryPhoto` (`/vehicles/:id`) | **PASS** |
| **DELETE** | `/vehicles/{id}/photos/{photoId}` | Delete vehicle photo | None | `ApiResponse<VehicleResponse>` | `VEHICLES:DELETE` | `vehicleService.deletePhoto` (`/vehicles/:id`) | **PASS** |
| **POST** | `/vehicles/{id}/documents` | Upload vehicle document (RC/Insurance) | MultipartFile (file, documentType, documentName) | `ApiResponse<VehicleResponse>` | `VEHICLES:EDIT` | `vehicleService.uploadDocument` (`/vehicles/:id`) | **PASS** |
| **DELETE** | `/vehicles/{id}/documents/{docId}` | Delete vehicle document | None | `ApiResponse<VehicleResponse>` | `VEHICLES:DELETE` | `vehicleService.deleteDocument` (`/vehicles/:id`) | **PASS** |
| **GET** | `/documents/{fileKey}/download` | Stream image or PDF document | Path: fileKey (UUID or filename) | Binary Resource (`image/jpeg`, `application/pdf`) | Public Read | `documentService.getFileDownloadUrl` | **PASS** |
| **POST** | `/documents/upload` | Standalone file upload | MultipartFile (file, category) | `ApiResponse<DocumentUploadResponse>` | Authenticated | `documentService.uploadFile` | **PASS** |
| **GET** | `/brokers` | List brokers with search | Query: page, size, search, active | `ApiResponse<PageResponse<BrokerResponse>>` | `BROKERS:VIEW` | `brokerService.getAllBrokers` (`/brokers`) | **PASS** |
| **POST** | `/brokers` | Create broker master | `BrokerCreateRequest` | `ApiResponse<BrokerResponse>` | `BROKERS:ADD` | `brokerService.createBroker` (`/brokers`) | **PASS** |
| **GET** | `/brokers/{id}` | Broker profile & statistics | Path: id | `ApiResponse<BrokerResponse>` | `BROKERS:VIEW` | `brokerService.getBrokerById` (`/brokers/:id`) | **PASS** |
| **GET** | `/brokers/{id}/dashboard` | Real-time broker sales & commission stats | Path: id | `ApiResponse<BrokerDashboardResponse>` | `BROKERS:VIEW` | `brokerService.getBrokerDashboard` (`/brokers/:id`) | **PASS** |
| **GET** | `/settlements` | Broker settlements list | Query: page, size, status, brokerId | `ApiResponse<PageResponse<BrokerSettlementResponse>>` | `BROKERS:VIEW` | `brokerService.getSettlements` (`/settlements`) | **PASS** |
| **GET** | `/settlements/{id}` | Settlement breakdown & payments | Path: id | `ApiResponse<BrokerSettlementResponse>` | `BROKERS:VIEW` | `brokerService.getSettlementById` (`/settlements/:id`) | **PASS** |
| **POST** | `/settlements/{id}/payments` | Payout broker settlement installment | `SettlementPaymentRequest` | `ApiResponse<BrokerSettlementResponse>` | `BROKERS:PAY` | `brokerService.recordSettlementPayment` (`/settlements/:id`) | **PASS** |
| **GET** | `/inspections` | List vehicle inspections | Query: page, size, vehicleId | `ApiResponse<PageResponse<InspectionResponse>>` | `WORKSHOP:VIEW` | `inspectionService.getAllInspections` (`/inspections`) | **PASS** |
| **POST** | `/inspections` | Record 15-point inspection | `InspectionCreateRequest` | `ApiResponse<InspectionResponse>` | `WORKSHOP:ADD` | `inspectionService.createInspection` (`/inspections/new`) | **PASS** |
| **GET** | `/job-cards` | List repair job cards | Query: page, size, status, vehicleId | `ApiResponse<PageResponse<JobCardResponse>>` | `WORKSHOP:VIEW` | `jobCardService.getAllJobCards` (`/job-cards`) | **PASS** |
| **POST** | `/job-cards` | Create repair job card | `JobCardCreateRequest` | `ApiResponse<JobCardResponse>` | `WORKSHOP:ADD` | `jobCardService.createJobCard` (`/job-cards/new`) | **PASS** |
| **PATCH** | `/job-cards/{id}/status` | Transition job card status | `JobCardStatusUpdateRequest` | `ApiResponse<JobCardResponse>` | `WORKSHOP:STATUS` | `jobCardService.updateStatus` (`/job-cards/:id`) | **PASS** |
| **GET** | `/parts` | Inventory parts master list | Query: page, size, search, category, lowStock | `ApiResponse<PageResponse<PartResponse>>` | `INVENTORY:VIEW` | `inventoryService.getAllParts` (`/inventory/parts`) | **PASS** |
| **POST** | `/parts` | Add new spare part or accessory | `PartCreateRequest` | `ApiResponse<PartResponse>` | `INVENTORY:ADD` | `inventoryService.createPart` (`/inventory/parts`) | **PASS** |
| **GET** | `/suppliers` | List parts suppliers | Query: page, size, search | `ApiResponse<PageResponse<SupplierResponse>>` | `INVENTORY:VIEW` | `inventoryService.getAllSuppliers` (`/inventory/suppliers`) | **PASS** |
| **POST** | `/suppliers` | Register supplier | `SupplierCreateRequest` | `ApiResponse<SupplierResponse>` | `INVENTORY:ADD` | `inventoryService.createSupplier` (`/inventory/suppliers`) | **PASS** |
| **POST** | `/purchase-invoices` | Receive stock invoice | `PurchaseInvoiceCreateRequest` | `ApiResponse<PurchaseInvoiceResponse>` | `INVENTORY:ADD` | `inventoryService.createInvoice` (`/inventory/invoices`) | **PASS** |
| **POST** | `/purchase-invoices/{id}/post` | Post invoice & increment inventory stock | None | `ApiResponse<PurchaseInvoiceResponse>` | `INVENTORY:EDIT` | `inventoryService.postInvoice` (`/inventory/invoices`) | **PASS** |
| **GET** | `/stock/movements` | Stock audit ledger (IN/OUT) | Query: page, size, partId, vehicleId | `ApiResponse<PageResponse<StockMovementResponse>>` | `INVENTORY:VIEW` | `inventoryService.getStockMovements` (`/inventory/movements`) | **PASS** |
| **GET** | `/costing/{vehicleId}` | Auditable vehicle costing breakdown | Path: vehicleId | `ApiResponse<VehicleCostResponse>` | `SALES:VIEW` | `costingService.getVehicleCost` (`/costing`) | **PASS** |
| **GET** | `/costing/{vehicleId}/profitability` | Realized gross profit / net commission | Path: vehicleId | `ApiResponse<VehicleProfitabilityResponse>` | `SALES:VIEW` | `costingService.getProfitability` (`/costing`) | **PASS** |
| **GET** | `/customers` | List dealership customer profiles | Query: page, size, search | `ApiResponse<PageResponse<CustomerResponse>>` | `CUSTOMERS:VIEW` | `customerService.getAllCustomers` (`/customers`) | **PASS** |
| **POST** | `/customers` | Create customer profile | `CustomerCreateRequest` | `ApiResponse<CustomerResponse>` | `CUSTOMERS:ADD` | `customerService.createCustomer` (`/customers`) | **PASS** |
| **GET** | `/customers/{id}/history` | Customer 360° vehicle/sales/service log | Path: id | `ApiResponse<Customer360Response>` | `CUSTOMERS:VIEW` | `customerService.getCustomerHistory` (`/customers/:id`) | **PASS** |
| **POST** | `/bookings` | Create advance vehicle reservation | `BookingCreateRequest` | `ApiResponse<BookingResponse>` | `SALES:ADD` | `salesService.createBooking` (`/bookings`) | **PASS** |
| **POST** | `/bookings/{id}/cancel` | Cancel booking & release reservation | Query: reason | `ApiResponse<BookingResponse>` | `SALES:EDIT` | `salesService.cancelBooking` (`/bookings`) | **PASS** |
| **POST** | `/sales` | Execute Direct or Finance sale | `SaleCreateRequest` | `ApiResponse<SaleResponse>` | `SALES:ADD` | `salesService.confirmSale` (`/sales/new`) | **PASS** |
| **GET** | `/sales/{id}` | Detailed sale invoice and payment ledger | Path: id | `ApiResponse<SaleResponse>` | `SALES:VIEW` | `salesService.getSaleById` (`/sales/:id`) | **PASS** |
| **POST** | `/sales/{id}/payments` | Record customer payment receipt | `PaymentCreateRequest` | `ApiResponse<PaymentResponse>` | `SALES:ADD` | `salesService.recordPayment` (`/sales/:id`) | **PASS** |
| **POST** | `/sales/{id}/deliveries` | Record vehicle delivery handover | `DeliveryCreateRequest` | `ApiResponse<DeliveryResponse>` | `SALES:EDIT` | `salesService.deliverVehicle` (`/deliveries`) | **PASS** |
| **GET** | `/finance/{saleId}` | Retrieve loan details and EMI schedule | Path: saleId | `ApiResponse<FinanceDetailResponse>` | `FINANCE:VIEW` | `financeService.getFinanceDetails` (`/finance/:id`) | **PASS** |
| **PATCH** | `/finance/emi/{emiId}/pay` | Record customer EMI payment | Query: paymentDate | `ApiResponse<EmiScheduleResponse>` | `FINANCE:EDIT` | `financeService.recordEmiPayment` (`/finance/:id`) | **PASS** |
| **POST** | `/service-records` | Create post-delivery service record | `ServiceRecordCreateRequest` | `ApiResponse<ServiceRecordResponse>` | `SERVICE:ADD` | `serviceRecordService.createRecord` (`/services/new`) | **PASS** |
| **GET** | `/service-records/due` | Reminders for upcoming/due/overdue service | None | `ApiResponse<List<ServiceDueResponse>>` | `SERVICE:VIEW` | `serviceRecordService.getDueReminders` (`/services`) | **PASS** |
| **GET** | `/dashboard/summary` | Aggregated executive KPIs | None | `ApiResponse<DashboardSummaryResponse>` | `DASHBOARD:VIEW` | `dashboardService.getDashboardSummary` (`/dashboard`) | **PASS** |
| **GET** | `/reports/{type}` | Tabular report data (vehicles, sales, profit, broker, stock, service) | Path: type, Query: from, to | `ApiResponse<ReportDataResponse>` | `REPORTS:VIEW` | `reportService.getReportData` (`/reports`) | **PASS** |
| **GET** | `/reports/{type}/export` | Export report to CSV or PDF | Path: type, Query: format (CSV/PDF) | Binary Attachment | `REPORTS:EXPORT` | `reportService.exportReport` (`/reports`) | **PASS** |
