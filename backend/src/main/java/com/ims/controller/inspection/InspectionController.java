package com.ims.controller.inspection;

import com.ims.common.ApiResponse;
import com.ims.dtos.workshop.InspectionCreateRequest;
import com.ims.dtos.workshop.InspectionResponse;
import com.ims.service.serviceInterface.workshop.WorkshopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inspections")
@RequiredArgsConstructor
@Tag(name = "Vehicle Inspections", description = "Endpoints for recording and retrieving 15-point mechanical and body inspections")
public class InspectionController {

    private final WorkshopService workshopService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create vehicle inspection", description = "Records 15 checkpoint inspection findings and initiates inspection lifecycle")
    public ResponseEntity<ApiResponse<InspectionResponse>> createInspection(@Valid @RequestBody InspectionCreateRequest request) {
        InspectionResponse response = workshopService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle inspection recorded successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get inspection by ID", description = "Retrieves inspection details and individual checkpoint results")
    public ResponseEntity<ApiResponse<InspectionResponse>> getInspectionById(@PathVariable Long id) {
        InspectionResponse response = workshopService.getInspectionById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("@permissionService.hasPermission('WORKSHOP', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get vehicle inspection history", description = "Retrieves all historical inspections performed on vehicle")
    public ResponseEntity<ApiResponse<List<InspectionResponse>>> getInspectionsByVehicle(@PathVariable Long vehicleId) {
        List<InspectionResponse> response = workshopService.getInspectionsByVehicle(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
