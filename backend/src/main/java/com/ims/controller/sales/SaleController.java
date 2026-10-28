package com.ims.controller.sales;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.sales.*;
import com.ims.enums.SaleStatus;
import com.ims.enums.SaleType;
import com.ims.service.serviceInterface.sales.SaleService;
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

import java.util.List;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
@Tag(name = "Sales Management", description = "Endpoints for vehicle sales transactions (Direct and Finance), customer payments, and vehicle delivery")
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('SALES', 'ADD')")
    @Operation(summary = "Confirm vehicle sale", description = "Executes sale transaction (Direct or Finance), transitions vehicle status to SOLD, initializes loan amortization if financed, creates broker commission/settlement snapshot if broker vehicle")
    public ResponseEntity<ApiResponse<SaleResponse>> confirmSale(
            @Valid @RequestBody SaleCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        SaleResponse response = saleService.confirmSale(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Sale confirmed successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "List all sales", description = "Retrieves paginated list of sales with filtering by sale type (DIRECT/FINANCE) and status")
    public ResponseEntity<ApiResponse<PageResponse<SaleResponse>>> getAllSales(
            @RequestParam(required = false) SaleType saleType,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<SaleResponse> response = saleService.getAllSales(saleType, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "Get sale by ID", description = "Retrieves complete sale record including payment history, finance summary, and delivery details")
    public ResponseEntity<ApiResponse<SaleResponse>> getSaleById(@PathVariable Long id) {
        SaleResponse response = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'ADD')")
    @Operation(summary = "Record customer payment", description = "Records customer installment or balance payment against sale. Supports idempotency key to prevent double posting on retries")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        PaymentResponse response = saleService.recordPayment(id, request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Payment recorded successfully", response));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "List sale payments", description = "Retrieves all payment receipts recorded against this sale")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsBySaleId(@PathVariable Long id) {
        SaleResponse sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.ok(sale.getPayments()));
    }

    @PostMapping("/{id}/deliveries")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'EDIT')")
    @Operation(summary = "Deliver vehicle", description = "Verifies payment conditions (full payment for Direct sales), records delivery event, odometer reading, recipient KYC and transitions vehicle status to DELIVERED")
    public ResponseEntity<ApiResponse<DeliveryResponse>> deliverVehicle(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        DeliveryResponse response = saleService.deliverVehicle(id, request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle delivered to customer successfully", response));
    }

    @GetMapping("/{id}/delivery")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "Get delivery details", description = "Retrieves physical vehicle delivery record for the specified sale")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryBySaleId(@PathVariable Long id) {
        try {
            DeliveryResponse response = saleService.getDeliveryBySaleId(id);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (com.ims.exception.ResourceNotFoundException ex) {
            // Vehicle has not been delivered yet; return null data with 200 OK so client does not produce 404 console errors
            return ResponseEntity.ok(ApiResponse.ok(null));
        }
    }
}
