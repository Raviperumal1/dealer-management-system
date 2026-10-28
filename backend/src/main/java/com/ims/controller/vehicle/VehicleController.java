package com.ims.controller.vehicle;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.vehicle.*;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
import com.ims.service.serviceInterface.vehicle.VehicleService;
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
@RequestMapping("/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle Management", description = "Endpoints for vehicle inventory, purchases, lifecycle transitions and history")
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'ADD')")
    @Operation(summary = "Add vehicle", description = "Registers a new CAR or BIKE (Own purchase or Broker consignment)")
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(
            @Valid @RequestBody VehicleCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        VehicleResponse response = vehicleService.createVehicle(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'VIEW')")
    @Operation(summary = "List all vehicles", description = "Retrieves paginated list of vehicles with filtering by type, ownership, status and search")
    public ResponseEntity<ApiResponse<PageResponse<VehicleResponse>>> getAllVehicles(
            @RequestParam(required = false) VehicleType type,
            @RequestParam(required = false) OwnershipType ownership,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<VehicleResponse> response = vehicleService.getAllVehicles(type, ownership, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/available")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'VIEW')")
    @Operation(summary = "List available vehicles", description = "Retrieves vehicles available for booking or purchase (READY_FOR_SALE and AVAILABLE)")
    public ResponseEntity<ApiResponse<PageResponse<VehicleResponse>>> getAvailableVehicles(
            @RequestParam(required = false) VehicleType type,
            @RequestParam(required = false) OwnershipType ownership,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<VehicleResponse> response = vehicleService.getAvailableVehicles(type, ownership, brand, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'VIEW')")
    @Operation(summary = "Get vehicle details", description = "Retrieves complete vehicle specification, purchase or broker details")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleById(@PathVariable Long id) {
        VehicleResponse response = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Update vehicle details", description = "Updates vehicle specifications")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleUpdateRequest request) {
        VehicleResponse response = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'STATUS') or hasRole('ADMIN')")
    @Operation(summary = "Transition vehicle status", description = "Performs validated state machine transition with audit logging")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicleStatus(
            @PathVariable Long id,
            @Valid @RequestBody VehicleStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        VehicleResponse response = vehicleService.updateVehicleStatus(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle status transitioned successfully", response));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'VIEW')")
    @Operation(summary = "Get vehicle status audit history", description = "Retrieves chronological status transition log")
    public ResponseEntity<ApiResponse<List<VehicleHistoryResponse>>> getVehicleHistory(@PathVariable Long id) {
        List<VehicleHistoryResponse> response = vehicleService.getVehicleHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping(value = "/{id}/photos", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Upload vehicle photo", description = "Uploads and associates a photo with the vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "isPrimary", required = false, defaultValue = "false") boolean isPrimary) {
        VehicleResponse response = vehicleService.uploadPhoto(id, file, caption, isPrimary);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle photo uploaded successfully", response));
    }

    @PatchMapping("/{id}/photos/{photoId}/primary")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Set primary photo", description = "Marks specified photo as the primary thumbnail for vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> setPrimaryPhoto(
            @PathVariable Long id,
            @PathVariable Long photoId) {
        VehicleResponse response = vehicleService.setPrimaryPhoto(id, photoId);
        return ResponseEntity.ok(ApiResponse.ok("Primary photo updated successfully", response));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Delete vehicle photo", description = "Deletes photo association and file record")
    public ResponseEntity<ApiResponse<VehicleResponse>> deletePhoto(
            @PathVariable Long id,
            @PathVariable Long photoId) {
        VehicleResponse response = vehicleService.deletePhoto(id, photoId);
        return ResponseEntity.ok(ApiResponse.ok("Photo deleted successfully", response));
    }

    @PostMapping(value = "/{id}/documents", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Upload vehicle document", description = "Uploads and associates an RC, insurance or test document with the vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "documentType", required = false, defaultValue = "RC") String documentType,
            @RequestParam(value = "documentName", required = false) String documentName) {
        VehicleResponse response = vehicleService.uploadDocument(id, file, documentType, documentName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle document uploaded successfully", response));
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @PreAuthorize("@permissionService.hasPermission('VEHICLES', 'EDIT')")
    @Operation(summary = "Delete vehicle document", description = "Deletes document record")
    public ResponseEntity<ApiResponse<VehicleResponse>> deleteDocument(
            @PathVariable Long id,
            @PathVariable Long documentId) {
        VehicleResponse response = vehicleService.deleteDocument(id, documentId);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", response));
    }
}
