package com.ims.controller.expense;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.costing.ShopExpenseCreateRequest;
import com.ims.dtos.costing.ShopExpenseResponse;
import com.ims.service.serviceInterface.costing.VehicleCostingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
@Tag(name = "Expense Management", description = "Endpoints for vehicle-specific and general dealership operational expenses")
public class ExpenseController {

    private final VehicleCostingService vehicleCostingService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'ADD')")
    @Operation(summary = "Add expense", description = "Records a vehicle-specific expense (e.g., detailing, transport, registration fees) or general shop operational expense")
    public ResponseEntity<ApiResponse<ShopExpenseResponse>> addExpense(@Valid @RequestBody ShopExpenseCreateRequest request) {
        ShopExpenseResponse response = vehicleCostingService.addShopExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Expense recorded successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'VIEW')")
    @Operation(summary = "List expenses", description = "Retrieves paginated list of expenses with filtering by vehicle or broker")
    public ResponseEntity<ApiResponse<PageResponse<ShopExpenseResponse>>> getExpenses(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long brokerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<ShopExpenseResponse> response = vehicleCostingService.getShopExpenses(vehicleId, brokerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
