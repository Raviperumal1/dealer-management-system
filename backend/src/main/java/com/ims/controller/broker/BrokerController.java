package com.ims.controller.broker;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.broker.*;
import com.ims.service.serviceInterface.broker.BrokerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brokers")
@RequiredArgsConstructor
@Tag(name = "Broker Management", description = "Endpoints for managing brokers, vehicle consignment listings and broker dashboards")
public class BrokerController {

    private final BrokerService brokerService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Register broker", description = "Creates a new broker master record")
    public ResponseEntity<ApiResponse<BrokerResponse>> createBroker(@Valid @RequestBody BrokerCreateRequest request) {
        BrokerResponse response = brokerService.createBroker(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Broker registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List brokers", description = "Retrieves paginated brokers with search and active filtering")
    public ResponseEntity<ApiResponse<PageResponse<BrokerResponse>>> getAllBrokers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<BrokerResponse> response = brokerService.getAllBrokers(search, active, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get broker by ID", description = "Retrieves broker details")
    public ResponseEntity<ApiResponse<BrokerResponse>> getBrokerById(@PathVariable Long id) {
        BrokerResponse response = brokerService.getBrokerById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Update broker", description = "Updates broker contact details and status")
    public ResponseEntity<ApiResponse<BrokerResponse>> updateBroker(
            @PathVariable Long id,
            @Valid @RequestBody BrokerUpdateRequest request) {
        BrokerResponse response = brokerService.updateBroker(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Broker updated successfully", response));
    }

    @PostMapping("/{id}/vehicles")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "List vehicle under broker", description = "Creates broker consignment listing for an existing broker vehicle")
    public ResponseEntity<ApiResponse<BrokerListingResponse>> addBrokerVehicleListing(
            @PathVariable Long id,
            @Valid @RequestBody BrokerListingCreateRequest request) {
        BrokerListingResponse response = brokerService.addBrokerVehicleListing(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Broker vehicle listed successfully", response));
    }

    @GetMapping("/{id}/vehicles")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get broker vehicle listings", description = "Retrieves all vehicle listings consigned by the broker")
    public ResponseEntity<ApiResponse<List<BrokerListingResponse>>> getBrokerListings(@PathVariable Long id) {
        List<BrokerListingResponse> response = brokerService.getBrokerListings(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("@permissionService.hasPermission('BROKERS', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get broker dashboard", description = "Retrieves KPI summary of listed, sold vehicles, commissions and settlements for broker")
    public ResponseEntity<ApiResponse<BrokerDashboardResponse>> getBrokerDashboard(@PathVariable Long id) {
        BrokerDashboardResponse response = brokerService.getBrokerDashboard(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
