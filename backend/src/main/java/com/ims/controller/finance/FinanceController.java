package com.ims.controller.finance;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.finance.*;
import com.ims.enums.FinanceStatus;
import com.ims.service.serviceInterface.finance.FinanceService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
@Tag(name = "Finance & Loan Management", description = "Endpoints for vehicle loan arrangements, EMI amortization schedules, and overdue tracking")
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "List finance arrangements", description = "Retrieves paginated list of financed sales with filtering by status and search")
    public ResponseEntity<ApiResponse<PageResponse<FinanceResponse>>> getAllFinance(
            @RequestParam(required = false) FinanceStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<FinanceResponse> response = financeService.getAllFinance(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get finance detail by ID", description = "Retrieves loan arrangement details including complete monthly EMI amortization schedule")
    public ResponseEntity<ApiResponse<FinanceResponse>> getFinanceById(@PathVariable Long id) {
        FinanceResponse response = financeService.getFinanceById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/sale/{saleId}")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get finance detail by sale ID", description = "Retrieves loan arrangement associated with a specific sale")
    public ResponseEntity<ApiResponse<FinanceResponse>> getFinanceBySaleId(@PathVariable Long saleId) {
        FinanceResponse response = financeService.getFinanceBySaleId(saleId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/overdue")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get overdue EMI installments", description = "Retrieves list of all loan installments past their due date that remain unpaid")
    public ResponseEntity<ApiResponse<List<EmiScheduleResponse>>> getOverdueEmis() {
        List<EmiScheduleResponse> overdue = financeService.getOverdueEmis();
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }

    @PostMapping("/emis/{id}/pay")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT')")
    @Operation(summary = "Record EMI installment payment", description = "Marks a specific EMI schedule installment as PAID and updates loan status if all installments are settled")
    public ResponseEntity<ApiResponse<EmiScheduleResponse>> recordEmiPayment(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paidDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        EmiScheduleResponse response = financeService.recordEmiPayment(id, paidDate, username);
        return ResponseEntity.ok(ApiResponse.ok("EMI installment payment recorded", response));
    }

    @PostMapping("/calculate")
    @Operation(summary = "Calculate loan EMI & amortization schedule", description = "Calculates monthly EMI, interest schedule, and total borrowing costs using reducing-balance formula")
    public ResponseEntity<ApiResponse<EmiCalculatorResponse>> calculateEmi(@Valid @RequestBody EmiCalculatorRequest request) {
        EmiCalculatorResponse response = financeService.calculateEmi(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/lenders")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "List active finance lenders", description = "Retrieves active banking and NBFC vehicle financing partners")
    public ResponseEntity<ApiResponse<List<FinanceLenderResponse>>> getActiveLenders() {
        List<FinanceLenderResponse> lenders = financeService.getActiveLenders();
        return ResponseEntity.ok(ApiResponse.ok(lenders));
    }

    @PostMapping("/lenders")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create finance lender partner", description = "Registers a new bank or NBFC lending partner")
    public ResponseEntity<ApiResponse<FinanceLenderResponse>> createLender(@RequestBody FinanceLenderResponse request) {
        FinanceLenderResponse response = financeService.createLender(request);
        return ResponseEntity.ok(ApiResponse.ok("Lender registered successfully", response));
    }

    @PostMapping("/applications")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'ADD')")
    @Operation(summary = "Submit customer finance application", description = "Creates a new in-house or external loan application for an existing customer and vehicle")
    public ResponseEntity<ApiResponse<FinanceApplicationResponse>> submitApplication(
            @Valid @RequestBody FinanceApplicationCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FinanceApplicationResponse response = financeService.submitApplication(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Finance application submitted", response));
    }

    @GetMapping("/applications")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "List finance applications", description = "Retrieves paginated customer loan applications with status and type filters")
    public ResponseEntity<ApiResponse<PageResponse<FinanceApplicationResponse>>> getApplications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String financeType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<FinanceApplicationResponse> response = financeService.getApplications(status, financeType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/applications/{id}")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get finance application by ID", description = "Retrieves single loan application details")
    public ResponseEntity<ApiResponse<FinanceApplicationResponse>> getApplicationById(@PathVariable Long id) {
        FinanceApplicationResponse response = financeService.getApplicationById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/applications/{id}/sanction")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Sanction loan application", description = "Records bank / in-house sanction amount, letter reference and validity")
    public ResponseEntity<ApiResponse<FinanceApplicationResponse>> sanctionApplication(
            @PathVariable Long id,
            @RequestBody ApplicationSanctionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FinanceApplicationResponse response = financeService.sanctionApplication(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Loan sanctioned", response));
    }

    @PostMapping("/applications/{id}/disburse")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Record lender disbursement", description = "Records actual disbursed amount received by dealership")
    public ResponseEntity<ApiResponse<FinanceApplicationResponse>> disburseApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationDisbursementRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FinanceApplicationResponse response = financeService.disburseApplication(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Disbursement recorded", response));
    }

    @PostMapping("/applications/{id}/reject")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Reject loan application", description = "Rejects finance application with explanatory reason")
    public ResponseEntity<ApiResponse<FinanceApplicationResponse>> rejectApplication(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FinanceApplicationResponse response = financeService.rejectApplication(id, reason, username);
        return ResponseEntity.ok(ApiResponse.ok("Application rejected", response));
    }

    @GetMapping("/{id}/eligibility")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get loan preclosure eligibility boundaries", description = "Evaluates calendar-month preclosure eligibility, inclusive window end date, and applicable policy fee base")
    public ResponseEntity<ApiResponse<LoanPreclosureEligibilityResponse>> getPreclosureEligibility(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate businessDate) {
        LoanPreclosureEligibilityResponse response = financeService.getPreclosureEligibility(id, businessDate);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/foreclosure-quote")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get loan foreclosure settlement quotation", description = "Calculates exact principal outstanding, accrued interest, foreclosure charges, and settlement payable")
    public ResponseEntity<ApiResponse<LoanForeclosureQuoteResponse>> getForeclosureQuote(@PathVariable Long id) {
        LoanForeclosureQuoteResponse response = financeService.getForeclosureQuote(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Close loan account", description = "Settles and closes active in-house loan account upon realization of funds")
    public ResponseEntity<ApiResponse<FinanceResponse>> closeLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanClosureRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        FinanceResponse response = financeService.closeLoan(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Loan account closed successfully", response));
    }

    @GetMapping("/{id}/ledger")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get immutable loan transaction ledger", description = "Retrieves double-entry chronological ledger history for the loan")
    public ResponseEntity<ApiResponse<List<LoanLedgerEntryResponse>>> getLoanLedger(@PathVariable Long id) {
        List<LoanLedgerEntryResponse> response = financeService.getLoanLedger(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/metrics")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get finance dashboard metrics", description = "Provides real-time portfolio metrics, active loans, overdue EMIs, and monthly collections")
    public ResponseEntity<ApiResponse<FinanceDashboardMetricsResponse>> getDashboardMetrics() {
        FinanceDashboardMetricsResponse response = financeService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/policies")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Get loan penalty & foreclosure policies", description = "Retrieves all configured Indian automotive loan penalty, grace period, and foreclosure rate policies")
    public ResponseEntity<ApiResponse<List<LoanPenaltyPolicyDto>>> getPenaltyPolicies() {
        List<LoanPenaltyPolicyDto> policies = financeService.getPenaltyPolicies();
        return ResponseEntity.ok(ApiResponse.ok(policies));
    }

    @PostMapping("/policies")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'ADD') or hasRole('ADMIN')")
    @Operation(summary = "Create loan penalty & foreclosure policy", description = "Creates a new automotive loan preclosure, penal interest, or grace period policy")
    public ResponseEntity<ApiResponse<LoanPenaltyPolicyDto>> createPenaltyPolicy(
            @Valid @RequestBody LoanPenaltyPolicyDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        LoanPenaltyPolicyDto created = financeService.createPenaltyPolicy(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Policy created successfully", created));
    }

    @PutMapping("/policies/{id}")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Update loan penalty & foreclosure policy", description = "Edits foreclosure prepayment fee rate, grace period, penal interest rate, or RBI exemption flag")
    public ResponseEntity<ApiResponse<LoanPenaltyPolicyDto>> updatePenaltyPolicy(
            @PathVariable Long id,
            @Valid @RequestBody LoanPenaltyPolicyDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        LoanPenaltyPolicyDto updated = financeService.updatePenaltyPolicy(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("Policy updated successfully", updated));
    }

    @PostMapping("/emis/{id}/pay-detailed")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT')")
    @Operation(summary = "Record detailed EMI payment with waterfall allocation", description = "Allocates payment across penalty, interest, and principal, updating ledger and loan balances")
    public ResponseEntity<ApiResponse<EmiScheduleResponse>> recordDetailedEmiPayment(
            @PathVariable Long id,
            @Valid @RequestBody EmiPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        EmiScheduleResponse response = financeService.recordDetailedEmiPayment(id, request, username);
        return ResponseEntity.ok(ApiResponse.ok("EMI installment payment recorded successfully", response));
    }

    @GetMapping("/{id}/noc-eligibility")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Check NOC certificate issuance eligibility", description = "Verifies loan closure, zero principal outstanding, and no pending installments")
    public ResponseEntity<ApiResponse<NocEligibilityResponse>> checkNocEligibility(@PathVariable Long id) {
        NocEligibilityResponse response = financeService.checkNocEligibility(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/noc")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Generate and issue official No Objection Certificate (NOC)", description = "Generates bank-grade NOC PDF and stores document in permanent registry")
    public ResponseEntity<ApiResponse<LoanDocumentResponse>> issueNoc(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        LoanDocumentResponse response = financeService.issueNoc(id, username);
        return ResponseEntity.ok(ApiResponse.ok("NOC certificate issued successfully", response));
    }

    @GetMapping("/{id}/noc/pdf")
    @Operation(summary = "Download official NOC PDF", description = "Streams printable No Objection Certificate PDF")
    public ResponseEntity<byte[]> downloadNocPdf(@PathVariable Long id) {
        byte[] pdf = financeService.downloadNocPdf(id);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"NOC_Loan_" + id + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/{id}/schedule/pdf")
    @Operation(summary = "Download Repayment Schedule PDF", description = "Streams printable loan repayment schedule PDF")
    public ResponseEntity<byte[]> downloadRepaymentSchedulePdf(@PathVariable Long id) {
        byte[] pdf = financeService.downloadRepaymentSchedulePdf(id);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Schedule_Loan_" + id + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/documents")
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'VIEW')")
    @Operation(summary = "Search centralized loan & customer documents", description = "Retrieves paginated list of documents with filtering by loan, customer, category, and type")
    public ResponseEntity<ApiResponse<PageResponse<LoanDocumentResponse>>> getLoanDocuments(
            @RequestParam(required = false) Long loanId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<LoanDocumentResponse> response = financeService.getLoanDocuments(loanId, customerId, category, documentType, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping(value = "/{id}/documents/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissionService.hasPermission('FINANCE', 'EDIT') or hasRole('ADMIN')")
    @Operation(summary = "Upload loan-associated document", description = "Attaches document to loan record with secure UUID storage")
    public ResponseEntity<ApiResponse<LoanDocumentResponse>> uploadLoanDocument(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "category", defaultValue = "LOAN") String category,
            @RequestParam(value = "documentType", defaultValue = "OTHER") String documentType,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        LoanDocumentResponse response = financeService.uploadLoanDocument(id, file, category, documentType, title, notes, username);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.created("Document uploaded and attached successfully", response));
    }
}
