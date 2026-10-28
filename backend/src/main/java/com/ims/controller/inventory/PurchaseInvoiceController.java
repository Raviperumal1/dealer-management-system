package com.ims.controller.inventory;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.inventory.PurchaseInvoiceCreateRequest;
import com.ims.dtos.inventory.PurchaseInvoiceResponse;
import com.ims.service.serviceInterface.inventory.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/purchase-invoices")
@RequiredArgsConstructor
@Tag(name = "Purchase Invoices & Orders", description = "Endpoints for managing supplier purchase invoices, credit purchases, and stock posting")
public class PurchaseInvoiceController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create purchase invoice", description = "Creates a draft purchase invoice with line items, tax, discounts, freight, and payment options")
    public ResponseEntity<ApiResponse<PurchaseInvoiceResponse>> createPurchaseInvoice(
            @Valid @RequestBody PurchaseInvoiceCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        PurchaseInvoiceResponse response = inventoryService.createPurchaseInvoice(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Purchase invoice created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List purchase invoices", description = "Retrieves paginated purchase invoices with supplier and status filters")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseInvoiceResponse>>> getAllPurchaseInvoices(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<PurchaseInvoiceResponse> response = inventoryService.getAllPurchaseInvoices(supplierId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get purchase invoice by ID", description = "Retrieves purchase invoice details and line items")
    public ResponseEntity<ApiResponse<PurchaseInvoiceResponse>> getPurchaseInvoiceById(@PathVariable Long id) {
        PurchaseInvoiceResponse response = inventoryService.getPurchaseInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Post purchase invoice", description = "Posts purchase invoice to inventory, increasing parts stock, allocating landed cost, and updating supplier ledger")
    public ResponseEntity<ApiResponse<PurchaseInvoiceResponse>> postPurchaseInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        PurchaseInvoiceResponse response = inventoryService.postPurchaseInvoice(id, username);
        return ResponseEntity.ok(ApiResponse.ok("Purchase invoice posted successfully and inventory updated", response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Cancel draft purchase invoice", description = "Cancels a draft purchase order/bill")
    public ResponseEntity<ApiResponse<PurchaseInvoiceResponse>> cancelPurchaseInvoice(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Cancelled by user") String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        PurchaseInvoiceResponse response = inventoryService.cancelPurchaseInvoice(id, reason, username);
        return ResponseEntity.ok(ApiResponse.ok("Purchase invoice cancelled", response));
    }
}
