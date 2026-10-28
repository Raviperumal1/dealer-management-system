package com.ims.controller.inventory;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.inventory.PartCreateRequest;
import com.ims.dtos.inventory.PartResponse;
import com.ims.dtos.inventory.PartUpdateRequest;
import com.ims.dtos.inventory.StockAdjustmentRequest;
import com.ims.enums.PartCategory;
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
@RequestMapping("/parts")
@RequiredArgsConstructor
@Tag(name = "Parts & Accessories Master", description = "Endpoints for managing parts master, pricing, threshold alerts and stock adjustments")
public class PartController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create part or accessory", description = "Registers a new part/accessory with SKU, pricing, vehicle compatibility and threshold")
    public ResponseEntity<ApiResponse<PartResponse>> createPart(@Valid @RequestBody PartCreateRequest request) {
        PartResponse response = inventoryService.createPart(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Part created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List parts and accessories", description = "Retrieves paginated parts with category, search and low-stock filters")
    public ResponseEntity<ApiResponse<PageResponse<PartResponse>>> getAllParts(
            @RequestParam(required = false) PartCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<PartResponse> response = inventoryService.getAllParts(category, search, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get part by ID", description = "Retrieves part details and stock information")
    public ResponseEntity<ApiResponse<PartResponse>> getPartById(@PathVariable Long id) {
        PartResponse response = inventoryService.getPartById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Update part", description = "Updates part pricing, threshold or active status")
    public ResponseEntity<ApiResponse<PartResponse>> updatePart(
            @PathVariable Long id,
            @Valid @RequestBody PartUpdateRequest request) {
        PartResponse response = inventoryService.updatePart(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Part updated successfully", response));
    }

    @PostMapping("/adjust")
    @PreAuthorize("@permissionService.hasPermission('INVENTORY', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Adjust part stock", description = "Manual stock reconciliation adjustment with reason and authorized user trace")
    public ResponseEntity<ApiResponse<PartResponse>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        PartResponse response = inventoryService.adjustStock(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Stock adjusted successfully", response));
    }
}
