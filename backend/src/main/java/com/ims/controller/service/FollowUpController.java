package com.ims.controller.service;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.service.FollowUpCreateRequest;
import com.ims.dtos.service.FollowUpResponse;
import com.ims.dtos.service.FollowUpUpdateRequest;
import com.ims.enums.FollowUpStatus;
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

@RestController
@RequestMapping("/follow-ups")
@RequiredArgsConstructor
@Tag(name = "Customer Follow-Up Management", description = "Endpoints for scheduling, logging and tracking post-sales customer follow-up calls and interactions")
public class FollowUpController {

    private final AfterSalesService afterSalesService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'ADD')")
    @Operation(summary = "Create customer follow-up", description = "Schedules a new follow-up interaction for vehicle maintenance or feedback")
    public ResponseEntity<ApiResponse<FollowUpResponse>> createFollowUp(
            @Valid @RequestBody FollowUpCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FollowUpResponse response = afterSalesService.createFollowUp(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Follow-up created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'VIEW')")
    @Operation(summary = "List follow-ups", description = "Retrieves paginated list of follow-ups filtered by status (UPCOMING, DUE, OVERDUE, CONTACTED, CLOSED), customer, or vehicle")
    public ResponseEntity<ApiResponse<PageResponse<FollowUpResponse>>> getAllFollowUps(
            @RequestParam(required = false) FollowUpStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<FollowUpResponse> response = afterSalesService.getAllFollowUps(status, customerId, vehicleId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('SERVICE', 'EDIT')")
    @Operation(summary = "Update follow-up outcome", description = "Logs follow-up conversation outcome, updates status and sets next contact date")
    public ResponseEntity<ApiResponse<FollowUpResponse>> updateFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody FollowUpUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FollowUpResponse response = afterSalesService.updateFollowUp(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up record updated", response));
    }
}
