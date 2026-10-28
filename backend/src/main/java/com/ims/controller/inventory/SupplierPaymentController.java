package com.ims.controller.inventory;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.inventory.StockAdjustmentRequest;
import com.ims.dtos.inventory.SupplierPaymentCreateRequest;
import com.ims.dtos.inventory.SupplierPaymentResponse;
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
@RequestMapping("/supplier-payments")
@RequiredArgsConstructor
@Tag(name = "Supplier Payments & Advances", description = "Endpoints for settling purchase bills and logging advances")
public class SupplierPaymentController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Record supplier payment or advance", description = "Supports full settlement, partial bill payment, or advance payments")
    public ResponseEntity<ApiResponse<SupplierPaymentResponse>> recordPayment(
            @Valid @RequestBody SupplierPaymentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        SupplierPaymentResponse response = inventoryService.recordSupplierPayment(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Supplier payment recorded successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List supplier payments", description = "Retrieves paginated supplier payment history")
    public ResponseEntity<ApiResponse<PageResponse<SupplierPaymentResponse>>> getAllPayments(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<SupplierPaymentResponse> response = inventoryService.getSupplierPayments(supplierId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
