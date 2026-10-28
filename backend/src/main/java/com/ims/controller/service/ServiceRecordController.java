package com.ims.controller.service;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.service.ServiceRecordCreateRequest;
import com.ims.dtos.service.ServiceRecordResponse;
import com.ims.enums.ServiceStatus;
import com.ims.service.serviceInterface.service.AfterSalesService;
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
@RequiredArgsConstructor
@Tag(name = "After-Sales Service Management", description = "Endpoints for vehicle maintenance records, spare parts consumption, reminders and overdue service tracking")
public class ServiceRecordController {

    private final AfterSalesService afterSalesService;

    @PostMapping("/service-records")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'ADD')")
    @Operation(summary = "Create service record", description = "Creates a vehicle service record with complaint, inspection notes, labour amount, and consumed inventory parts. Consumes parts stock and schedules next service reminder")
    public ResponseEntity<ApiResponse<ServiceRecordResponse>> createServiceRecord(
            @Valid @RequestBody ServiceRecordCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        ServiceRecordResponse response = afterSalesService.createServiceRecord(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Service record created successfully", response));
    }

    @GetMapping("/service-records")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "List service records", description = "Retrieves paginated list of service records filtered by customer, vehicle, or status")
    public ResponseEntity<ApiResponse<PageResponse<ServiceRecordResponse>>> getAllServiceRecords(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) ServiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<ServiceRecordResponse> response = afterSalesService.getAllServiceRecords(customerId, vehicleId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/service-records/{id}")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "Get service record by ID", description = "Retrieves service record details including used parts and amounts")
    public ResponseEntity<ApiResponse<ServiceRecordResponse>> getServiceRecordById(@PathVariable Long id) {
        ServiceRecordResponse response = afterSalesService.getServiceRecordById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/service/due")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "Get due service records", description = "Retrieves service appointments due today")
    public ResponseEntity<ApiResponse<List<ServiceRecordResponse>>> getDueServices() {
        List<ServiceRecordResponse> response = afterSalesService.getDueServices();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/service/upcoming")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "Get upcoming service records", description = "Retrieves upcoming services scheduled within next N days (default 7)")
    public ResponseEntity<ApiResponse<List<ServiceRecordResponse>>> getUpcomingServices(
            @RequestParam(defaultValue = "7") Integer days) {
        List<ServiceRecordResponse> response = afterSalesService.getUpcomingServices(days);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/service/overdue")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "Get overdue service records", description = "Retrieves services whose target next service date has passed")
    public ResponseEntity<ApiResponse<List<ServiceRecordResponse>>> getOverdueServices() {
        List<ServiceRecordResponse> response = afterSalesService.getOverdueServices();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
