package com.ims.controller.dashboard;

import com.ims.common.ApiResponse;
import com.ims.dtos.dashboard.DashboardSummaryResponse;
import com.ims.service.serviceInterface.dashboard.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Analytics", description = "Endpoints for aggregated executive KPIs across inventory, purchases, sales, finance, workshop and service")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @PreAuthorize("@permissionService.hasPermission('DASHBOARD', 'VIEW')")
    @Operation(summary = "Get executive dashboard KPIs", description = "Retrieves aggregated metrics: inventory counts, purchase totals, sales performance, profit/commission breakdowns, pending settlements, workshop repair stats, and upcoming service alerts")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {
        DashboardSummaryResponse summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
