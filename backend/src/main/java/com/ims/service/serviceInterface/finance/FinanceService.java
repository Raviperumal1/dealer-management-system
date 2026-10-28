package com.ims.service.serviceInterface.finance;

import com.ims.common.PageResponse;
import com.ims.dtos.finance.*;
import com.ims.enums.FinanceStatus;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface FinanceService {
    PageResponse<FinanceResponse> getAllFinance(FinanceStatus status, String search, Pageable pageable);
    FinanceResponse getFinanceById(Long id);
    FinanceResponse getFinanceBySaleId(Long saleId);
    List<EmiScheduleResponse> getOverdueEmis();
    EmiScheduleResponse recordEmiPayment(Long emiId, LocalDate paidDate, String username);

    // EMI Calculator
    EmiCalculatorResponse calculateEmi(EmiCalculatorRequest request);

    // Lenders / Financing Partners
    List<FinanceLenderResponse> getActiveLenders();
    FinanceLenderResponse createLender(FinanceLenderResponse request);

    // Customer Finance Applications
    FinanceApplicationResponse submitApplication(FinanceApplicationCreateRequest request, String username);
    PageResponse<FinanceApplicationResponse> getApplications(String status, String financeType, Pageable pageable);
    FinanceApplicationResponse getApplicationById(Long id);
    FinanceApplicationResponse sanctionApplication(Long id, ApplicationSanctionRequest request, String username);
    FinanceApplicationResponse disburseApplication(Long id, ApplicationDisbursementRequest request, String username);
    FinanceApplicationResponse rejectApplication(Long id, String reason, String username);

    // Loan Settlement, Prepayment & Foreclosure
    LoanPreclosureEligibilityResponse getPreclosureEligibility(Long loanId, LocalDate businessDate);
    LoanForeclosureQuoteResponse getForeclosureQuote(Long loanId);
    FinanceResponse closeLoan(Long loanId, LoanClosureRequest request, String username);

    // Loan Ledger & Audit Trail
    List<LoanLedgerEntryResponse> getLoanLedger(Long loanId);
    void assessOverdueCharges();

    // Policy Engine Configuration
    List<LoanPenaltyPolicyDto> getPenaltyPolicies();
    LoanPenaltyPolicyDto createPenaltyPolicy(LoanPenaltyPolicyDto dto, String username);
    LoanPenaltyPolicyDto updatePenaltyPolicy(Long id, LoanPenaltyPolicyDto dto, String username);

    // Payment Allocation & History
    EmiScheduleResponse recordDetailedEmiPayment(Long emiId, EmiPaymentRequest request, String username);

    // NOC Verification & Issuance
    NocEligibilityResponse checkNocEligibility(Long loanId);
    LoanDocumentResponse issueNoc(Long loanId, String username);

    // Centralized Document Management & PDF Downloads
    LoanDocumentResponse uploadLoanDocument(Long loanId, org.springframework.web.multipart.MultipartFile file, String category, String documentType, String title, String notes, String username);
    com.ims.common.PageResponse<LoanDocumentResponse> getLoanDocuments(Long loanId, Long customerId, String category, String documentType, String search, Pageable pageable);
    byte[] downloadNocPdf(Long loanId);
    byte[] downloadRepaymentSchedulePdf(Long loanId);

    // Dashboard & Analytics
    FinanceDashboardMetricsResponse getDashboardMetrics();
}
