package com.ims.controller.inventory;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.inventory.InventoryDashboardMetricsResponse;
import com.ims.dtos.inventory.PartResponse;
import com.ims.dtos.inventory.StockMovementResponse;
import com.ims.service.serviceInterface.inventory.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
@Tag(name = "Stock & Inventory Movements", description = "Endpoints for viewing stock movements ledger, low-stock alerts, and inventory dashboard metrics")
public class StockController {

    private final InventoryService inventoryService;

    @GetMapping("/movements")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get stock movements ledger", description = "Retrieves paginated append-only stock ledger movements with part and vehicle filtering")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> getStockMovements(
            @RequestParam(required = false) Long partId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<StockMovementResponse> response = inventoryService.getStockMovements(partId, vehicleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get low stock parts", description = "Retrieves all active parts where current stock is less than or equal to low stock threshold")
    public ResponseEntity<ApiResponse<List<PartResponse>>> getLowStockParts() {
        List<PartResponse> response = inventoryService.getLowStockParts();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/metrics")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get inventory dashboard metrics", description = "Retrieves total spare parts count, low-stock count, valuation, supplier outstanding, and credit utilization rate")
    public ResponseEntity<ApiResponse<InventoryDashboardMetricsResponse>> getInventoryDashboardMetrics() {
        InventoryDashboardMetricsResponse response = inventoryService.getInventoryDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
