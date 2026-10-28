package com.ims.controller.finance;

import com.ims.common.ApiResponse;
import com.ims.dtos.finance.LenderCommissionRequest;
import com.ims.dtos.finance.LenderCommissionResponse;
import com.ims.dtos.finance.LenderReceiptRequest;
import com.ims.service.serviceInterface.finance.LenderCommissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/finance/commissions")
@RequiredArgsConstructor
@Tag(name = "Lender Commissions", description = "Finance Partner Commission Accounting, Sourcing Fees, Invoicing & Receipts")
public class LenderCommissionController {

    private final LenderCommissionService commissionService;

    @PostMapping("/calculate")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Preview Dynamic Commission Calculation", description = "Computes gross, GST, TDS and net receivable without persisting")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> calculatePreview(@RequestBody LenderCommissionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Commission preview computed successfully", commissionService.calculateCommissionPreview(request)));
    }

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create Commission Entry", description = "Books a loan-linked or manual partner commission receivable")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> createEntry(
            @RequestBody LenderCommissionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        return ResponseEntity.ok(ApiResponse.ok("Commission entry created successfully", commissionService.createCommissionEntry(request, username)));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get All Lender Commissions", description = "Paginated list with partner and status filters")
    public ResponseEntity<ApiResponse<Page<LenderCommissionResponse>>> getCommissions(
            @RequestParam(required = false) Long lenderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "entryDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok("Commissions retrieved", commissionService.getCommissions(lenderId, status, search, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Commission details retrieved", commissionService.getCommissionById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> approveCommission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String remarks = body != null ? body.get("remarks") : "Approved";
        return ResponseEntity.ok(ApiResponse.ok("Commission approved", commissionService.approveCommission(id, remarks, username)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> rejectCommission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String remarks = body != null ? body.get("remarks") : "Rejected";
        return ResponseEntity.ok(ApiResponse.ok("Commission rejected", commissionService.rejectCommission(id, remarks, username)));
    }

    @PostMapping("/{id}/invoice")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> generateInvoice(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String invNo = body != null ? body.get("invoiceNumber") : null;
        LocalDate invDate = body != null && body.get("invoiceDate") != null ? LocalDate.parse(body.get("invoiceDate")) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.ok("Commission invoice generated", commissionService.generateInvoice(id, invNo, invDate, username)));
    }

    @PostMapping("/{id}/receipt")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> recordReceipt(
            @PathVariable Long id,
            @RequestBody LenderReceiptRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        return ResponseEntity.ok(ApiResponse.ok("Payment receipt allocated and recorded", commissionService.recordReceipt(id, request, username)));
    }

    @PostMapping("/{id}/reverse")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LenderCommissionResponse>> reverseCommission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "ADMIN";
        String reason = body != null ? body.get("reason") : "Clawback / Authorized reversal";
        return ResponseEntity.ok(ApiResponse.ok("Commission reversed", commissionService.reverseCommission(id, reason, username)));
    }

    @GetMapping("/metrics")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardMetrics() {
        return ResponseEntity.ok(ApiResponse.ok("Commission metrics retrieved", commissionService.getCommissionDashboardMetrics()));
    }
}
