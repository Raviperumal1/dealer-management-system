package com.ims.controller.supplier;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.inventory.*;
import com.ims.service.serviceInterface.inventory.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier Management & Ledger", description = "Endpoints for managing parts suppliers, credit accounts, and ledger statements")
public class SupplierController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create supplier", description = "Registers a new parts supplier or service agency")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(@Valid @RequestBody SupplierCreateRequest request) {
        SupplierResponse response = inventoryService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Supplier created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List suppliers", description = "Retrieves paginated suppliers with search and active filtering")
    public ResponseEntity<ApiResponse<PageResponse<SupplierResponse>>> getAllSuppliers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<SupplierResponse> response = inventoryService.getAllSuppliers(search, active, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get supplier by ID", description = "Retrieves supplier profile and credit details")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        SupplierResponse response = inventoryService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Update supplier", description = "Updates supplier profile, contact or credit limit")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @RequestBody SupplierUpdateRequest request) {
        SupplierResponse response = inventoryService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Supplier updated successfully", response));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Deactivate supplier", description = "Safely deactivates supplier while retaining historical ledger transactions")
    public ResponseEntity<ApiResponse<SupplierResponse>> deactivateSupplier(@PathVariable Long id) {
        SupplierResponse response = inventoryService.deactivateSupplier(id);
        return ResponseEntity.ok(ApiResponse.ok("Supplier deactivated successfully", response));
    }

    @GetMapping("/{id}/ledger")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get supplier ledger", description = "Retrieves chronological accounting ledger entries for supplier")
    public ResponseEntity<ApiResponse<PageResponse<SupplierLedgerEntryResponse>>> getSupplierLedger(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageUtil.createPageable(page, size, "entryDate", "desc");
        PageResponse<SupplierLedgerEntryResponse> response = inventoryService.getSupplierLedger(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/statement")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get supplier account statement", description = "Generates account statement with debits, credits, and running balance for a date range")
    public ResponseEntity<ApiResponse<SupplierStatementResponse>> getSupplierStatement(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        SupplierStatementResponse response = inventoryService.getSupplierStatement(id, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get supplier payments", description = "Retrieves payments made to supplier")
    public ResponseEntity<ApiResponse<PageResponse<SupplierPaymentResponse>>> getSupplierPayments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageUtil.createPageable(page, size, "paymentDate", "desc");
        PageResponse<SupplierPaymentResponse> response = inventoryService.getSupplierPayments(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
