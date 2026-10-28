package com.ims.controller.costing;

import com.ims.common.ApiResponse;
import com.ims.dtos.costing.MarketComparableCreateRequest;
import com.ims.dtos.costing.MarketComparableResponse;
import com.ims.dtos.costing.MarketPricingAnalysisResponse;
import com.ims.dtos.costing.VehicleCostResponse;
import com.ims.dtos.costing.VehicleProfitabilityResponse;
import com.ims.service.serviceInterface.costing.VehicleCostingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/vehicles/{id}")
@RequiredArgsConstructor
@Tag(name = "Vehicle Costing & Profitability", description = "Endpoints for vehicle cost breakdown, recognized gross profit/commission calculations, and market pricing")
public class CostingController {

    private final VehicleCostingService vehicleCostingService;

    @GetMapping("/costing")
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'VIEW')")
    @Operation(summary = "Get vehicle costing breakdown", description = "Calculates total capitalized vehicle cost for Own vehicles (Purchase + Repairs + Accessories + Labour + Expenses) or broker expense attribution for Broker vehicles")
    public ResponseEntity<ApiResponse<VehicleCostResponse>> getVehicleCost(@PathVariable Long id) {
        VehicleCostResponse response = vehicleCostingService.getVehicleCost(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/profitability")
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'VIEW')")
    @Operation(summary = "Get vehicle profitability", description = "Calculates realized or projected profit: Own vehicle (Sale Price - Total Cost = Gross Profit); Broker vehicle (Sale Price - Settlement Basis = Gross Commission; Gross Commission - Shop Repairs - Other Expenses = Net Commission)")
    public ResponseEntity<ApiResponse<VehicleProfitabilityResponse>> getVehicleProfitability(@PathVariable Long id) {
        VehicleProfitabilityResponse response = vehicleCostingService.getVehicleProfitability(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/pricing")
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'VIEW')")
    @Operation(summary = "Get vehicle pricing analysis", description = "Provides recommended selling prices based on markup percentage, target gross margin percentage, and verified market comparables")
    public ResponseEntity<ApiResponse<MarketPricingAnalysisResponse>> getVehiclePricingAnalysis(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "15.0") BigDecimal markup,
            @RequestParam(required = false, defaultValue = "15.0") BigDecimal targetMargin) {
        MarketPricingAnalysisResponse response = vehicleCostingService.getMarketPricingAnalysis(id, markup, targetMargin);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/comparables")
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Add market comparable listing", description = "Records a verified market listing for benchmark comparison")
    public ResponseEntity<ApiResponse<MarketComparableResponse>> addMarketComparable(
            @PathVariable Long id,
            @Valid @RequestBody MarketComparableCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        request.setVehicleId(id);
        MarketComparableResponse response = vehicleCostingService.addMarketComparable(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Market comparable added successfully", response));
    }

    @GetMapping("/comparables")
    @PreAuthorize("@permissionService.hasPermission('COSTING', 'VIEW')")
    @Operation(summary = "Get market comparables", description = "Retrieves comparable listings for vehicle make, model and variant")
    public ResponseEntity<ApiResponse<List<MarketComparableResponse>>> getMarketComparables(@PathVariable Long id) {
        List<MarketComparableResponse> list = vehicleCostingService.getMarketComparables(id);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
