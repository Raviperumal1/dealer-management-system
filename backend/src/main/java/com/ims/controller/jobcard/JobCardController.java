package com.ims.controller.jobcard;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.workshop.JobCardCreateRequest;
import com.ims.dtos.workshop.JobCardResponse;
import com.ims.dtos.workshop.JobCardStatusUpdateRequest;
import com.ims.dtos.workshop.JobCardUpdateRequest;
import com.ims.enums.JobCardStatus;
import com.ims.service.serviceInterface.workshop.WorkshopService;
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
@RequestMapping("/job-cards")
@RequiredArgsConstructor
@Tag(name = "Workshop Job Cards", description = "Endpoints for creating workshop repair job cards, issuing parts, tracking labour and cost splits")
public class JobCardController {

    private final WorkshopService workshopService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create workshop job card", description = "Creates repair job card, consumes stock parts, calculates costs and assigns responsibility")
    public ResponseEntity<ApiResponse<JobCardResponse>> createJobCard(@Valid @RequestBody JobCardCreateRequest request) {
        JobCardResponse response = workshopService.createJobCard(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Job card created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "List job cards", description = "Retrieves paginated job cards with filtering by status")
    public ResponseEntity<ApiResponse<PageResponse<JobCardResponse>>> getAllJobCards(
            @RequestParam(required = false) JobCardStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<JobCardResponse> response = workshopService.getAllJobCards(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get job card details", description = "Retrieves job card, repair items, parts issued, labour entries and cost allocation")
    public ResponseEntity<ApiResponse<JobCardResponse>> getJobCardById(@PathVariable Long id) {
        JobCardResponse response = workshopService.getJobCardById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get job cards by vehicle", description = "Retrieves all job cards associated with a vehicle")
    public ResponseEntity<ApiResponse<List<JobCardResponse>>> getJobCardsByVehicle(@PathVariable Long vehicleId) {
        List<JobCardResponse> response = workshopService.getJobCardsByVehicle(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Update job card", description = "Updates job card details, staff assignment, remarks or cost split")
    public ResponseEntity<ApiResponse<JobCardResponse>> updateJobCard(
            @PathVariable Long id,
            @Valid @RequestBody JobCardUpdateRequest request) {
        JobCardResponse response = workshopService.updateJobCard(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Job card updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'STATUS') or hasRole('ADMIN')")
    @Operation(summary = "Update job card status", description = "Transitions job card status (e.g. to COMPLETED) and updates vehicle readiness")
    public ResponseEntity<ApiResponse<JobCardResponse>> updateJobCardStatus(
            @PathVariable Long id,
            @Valid @RequestBody JobCardStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        JobCardResponse response = workshopService.updateJobCardStatus(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Job card status updated successfully", response));
    }
}
