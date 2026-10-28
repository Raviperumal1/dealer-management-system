package com.ims.controller.settlement;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.broker.SettlementPaymentRequest;
import com.ims.dtos.broker.SettlementResponse;
import com.ims.enums.SettlementStatus;
import com.ims.service.serviceInterface.broker.BrokerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
@Tag(name = "Broker Settlements", description = "Endpoints for managing broker settlements, payouts and balance tracking")
public class SettlementController {

    private final BrokerService brokerService;

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List settlements", description = "Retrieves paginated broker settlements with filtering by broker and status")
    public ResponseEntity<ApiResponse<PageResponse<SettlementResponse>>> getSettlements(
            @RequestParam(required = false) Long brokerId,
            @RequestParam(required = false) SettlementStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<SettlementResponse> response = brokerService.getSettlements(brokerId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get settlement details", description = "Retrieves settlement details and payment installment history")
    public ResponseEntity<ApiResponse<SettlementResponse>> getSettlementById(@PathVariable Long id) {
        SettlementResponse response = brokerService.getSettlementById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'PAY') or hasRole('ADMIN')")
    @Operation(summary = "Record settlement payment", description = "Records payout towards broker settlement, validates against balance, updates status")
    public ResponseEntity<ApiResponse<SettlementResponse>> recordSettlementPayment(
            @PathVariable Long id,
            @Valid @RequestBody SettlementPaymentRequest request) {
        SettlementResponse response = brokerService.recordSettlementPayment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Settlement payment recorded successfully", response));
    }
}
