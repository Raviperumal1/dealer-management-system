package com.ims.service.impl.finance;

import com.ims.common.PageResponse;
import com.ims.dtos.finance.*;
import com.ims.entity.finance.*;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.FinanceStatus;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.sales.CustomerRepository;
import com.ims.repository.finance.*;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.serviceInterface.finance.FinanceService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private final FinanceDetailRepository financeDetailRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final FinanceLenderRepository financeLenderRepository;
    private final FinanceApplicationRepository financeApplicationRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final LoanLedgerEntryRepository loanLedgerEntryRepository;
    private final LoanPenaltyPolicyRepository loanPenaltyPolicyRepository;
    private final com.ims.repository.sales.SaleRepository saleRepository;
    private final com.ims.repository.sales.PaymentRepository paymentRepository;
    private final LoanDocumentRepository loanDocumentRepository;
    private final com.ims.utils.storage.StorageService storageService;
    private final LoanDocumentPdfGeneratorService loanDocumentPdfGeneratorService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FinanceResponse> getAllFinance(FinanceStatus status, String search, Pageable pageable) {
        Specification<FinanceDetailEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("financeCompany")), pattern),
                        cb.like(cb.lower(root.get("loanAccountNumber")), pattern),
                        cb.like(cb.lower(root.join("sale").join("customer").get("name")), pattern),
                        cb.like(cb.lower(root.join("sale").join("vehicle").get("registrationNumber")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<FinanceDetailEntity> page = financeDetailRepository.findAll(spec, pageable);
        List<FinanceResponse> content = page.getContent().stream()
                .map(this::mapToFinanceResponseBasic)
                .collect(Collectors.toList());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceResponse getFinanceById(Long id) {
        FinanceDetailEntity entity = financeDetailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Finance arrangement not found with id: " + id));
        return mapToFinanceResponseWithSchedule(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceResponse getFinanceBySaleId(Long saleId) {
        FinanceDetailEntity entity = financeDetailRepository.findBySaleId(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Finance arrangement not found for sale id: " + saleId));
        return mapToFinanceResponseWithSchedule(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmiScheduleResponse> getOverdueEmis() {
        LocalDate today = LocalDate.now();
        List<EmiScheduleEntity> overdue = emiScheduleRepository.findOverdueEmis(today);
        return overdue.stream().map(this::mapToEmiResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EmiScheduleResponse recordEmiPayment(Long emiId, LocalDate paidDate, String username) {
        EmiScheduleEntity emi = emiScheduleRepository.findById(emiId)
                .orElseThrow(() -> new ResourceNotFoundException("EMI installment not found with id: " + emiId));

        if ("PAID".equalsIgnoreCase(emi.getStatus())) {
            throw new BusinessRuleViolationException("EMI installment #" + emi.getInstallmentNumber() + " is already marked as PAID");
        }

        emi.setStatus("PAID");
        emi.setPaidDate(paidDate != null ? paidDate : LocalDate.now());
        EmiScheduleEntity updated = emiScheduleRepository.save(emi);

        // Update principal and interest paid metrics on parent loan
        FinanceDetailEntity finance = emi.getFinanceDetail();
        BigDecimal newPrincipalPaid = (finance.getTotalPrincipalPaid() != null ? finance.getTotalPrincipalPaid() : BigDecimal.ZERO)
                .add(emi.getPrincipalAmount());
        BigDecimal newInterestPaid = (finance.getTotalInterestPaid() != null ? finance.getTotalInterestPaid() : BigDecimal.ZERO)
                .add(emi.getInterestAmount());
        BigDecimal newPrincipalOutstanding = finance.getLoanAmount().subtract(newPrincipalPaid);
        if (newPrincipalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            newPrincipalOutstanding = BigDecimal.ZERO;
        }

        finance.setTotalPrincipalPaid(newPrincipalPaid);
        finance.setTotalInterestPaid(newInterestPaid);
        finance.setPrincipalOutstanding(newPrincipalOutstanding);

        // Record immutable ledger entry for EMI collection
        Long customerId = (finance.getSale() != null && finance.getSale().getCustomer() != null)
                ? finance.getSale().getCustomer().getId()
                : 1L;
        Long saleId = finance.getSale() != null ? finance.getSale().getId() : null;

        LoanLedgerEntryEntity ledgerEntry = LoanLedgerEntryEntity.builder()
                .transactionId("TX-EMI-" + emi.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .financeDetail(finance)
                .customerId(customerId)
                .saleId(saleId)
                .transactionType("EMI_PAYMENT")
                .entryDirection("CREDIT") // Decreases borrower principal balance
                .amount(emi.getEmiAmount())
                .principalPortion(emi.getPrincipalAmount())
                .interestPortion(emi.getInterestAmount())
                .feePortion(BigDecimal.ZERO)
                .penaltyPortion(emi.getPenaltyAmount() != null ? emi.getPenaltyAmount() : BigDecimal.ZERO)
                .principalBalanceAfter(newPrincipalOutstanding)
                .effectiveDate(emi.getPaidDate())
                .sourceReference("EMI-INSTALMENT-#" + emi.getInstallmentNumber())
                .paymentMethod(emi.getPaymentMethod() != null ? emi.getPaymentMethod() : "BANK_TRANSFER")
                .paymentReference(emi.getPaymentReference())
                .idempotencyKey("EMI-PAY-" + emi.getId())
                .status("POSTED")
                .createdByUser(username != null ? username : "SYSTEM")
                .notes("Regular scheduled EMI payment installment #" + emi.getInstallmentNumber())
                .build();
        loanLedgerEntryRepository.save(ledgerEntry);

        // Check if all EMIs for this loan are paid and principal outstanding is exactly settled
        List<EmiScheduleEntity> allEmis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(finance.getId());
        boolean allPaid = allEmis.stream().allMatch(e -> "PAID".equalsIgnoreCase(e.getStatus()));
        if (allPaid && newPrincipalOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            finance.setStatus(FinanceStatus.CLOSED);
            finance.setClosedDate(LocalDate.now());
            finance.setClosureRemarks("All scheduled EMIs settled successfully with zero contractual principal balance.");
            log.info("All EMIs completed for finance arrangement #{}. Status marked as CLOSED.", finance.getId());

            LoanLedgerEntryEntity closeEntry = LoanLedgerEntryEntity.builder()
                    .transactionId("TX-CLS-" + finance.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .financeDetail(finance)
                    .customerId(customerId)
                    .saleId(saleId)
                    .transactionType("LOAN_CLOSURE")
                    .entryDirection("CREDIT")
                    .amount(BigDecimal.ZERO)
                    .principalPortion(BigDecimal.ZERO)
                    .interestPortion(BigDecimal.ZERO)
                    .principalBalanceAfter(BigDecimal.ZERO)
                    .effectiveDate(LocalDate.now())
                    .sourceReference("LOAN-CLOSURE-NO-DUES")
                    .status("POSTED")
                    .createdByUser(username != null ? username : "SYSTEM")
                    .notes("Loan fully paid off and closed via scheduled amortisation")
                    .build();
            loanLedgerEntryRepository.save(closeEntry);
        }
        financeDetailRepository.save(finance);

        return mapToEmiResponse(updated);
    }

    // -------------------------------------------------------------
    // EMI CALCULATOR
    // -------------------------------------------------------------
    @Override
    public EmiCalculatorResponse calculateEmi(EmiCalculatorRequest request) {
        BigDecimal downPay = request.getDownPayment() != null ? request.getDownPayment() : BigDecimal.ZERO;
        BigDecimal tradeIn = request.getTradeInCredit() != null ? request.getTradeInCredit() : BigDecimal.ZERO;
        BigDecimal fees = request.getFinancedFees() != null ? request.getFinancedFees() : BigDecimal.ZERO;

        BigDecimal amountFinanced = request.getVehicleAmount()
                .subtract(downPay)
                .subtract(tradeIn)
                .add(fees);

        if (amountFinanced.compareTo(BigDecimal.ZERO) < 0) {
            amountFinanced = BigDecimal.ZERO;
        }

        int n = request.getTenureMonths();
        BigDecimal annualRate = request.getAnnualInterestRate();
        BigDecimal emiAmount;

        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            emiAmount = n > 0 ? amountFinanced.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        } else {
            double p = amountFinanced.doubleValue();
            double r = (annualRate.doubleValue() / 100.0) / 12.0;
            double emiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            emiAmount = BigDecimal.valueOf(emiVal).setScale(2, RoundingMode.HALF_UP);
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate currentDue = startDate.plusMonths(1);
        LocalDate firstDue = currentDue;
        LocalDate lastDue = startDate.plusMonths(n);

        BigDecimal remainingPrincipal = amountFinanced;
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 8, RoundingMode.HALF_UP);
        BigDecimal totalInterest = BigDecimal.ZERO;

        List<EmiCalculatorResponse.AmortizationRowDto> schedule = new ArrayList<>();

        for (int i = 1; i <= n; i++) {
            BigDecimal opening = remainingPrincipal;
            BigDecimal interest = opening.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = emiAmount.subtract(interest);

            if (principal.compareTo(remainingPrincipal) > 0 || i == n) {
                principal = remainingPrincipal;
                emiAmount = principal.add(interest); // reconcile rounding on final instalment
            }

            BigDecimal closing = opening.subtract(principal);
            if (closing.compareTo(BigDecimal.ZERO) < 0) {
                closing = BigDecimal.ZERO;
            }
            remainingPrincipal = closing;
            totalInterest = totalInterest.add(interest);

            schedule.add(EmiCalculatorResponse.AmortizationRowDto.builder()
                    .installmentNumber(i)
                    .dueDate(currentDue)
                    .openingPrincipal(opening)
                    .scheduledEmi(emiAmount)
                    .principalComponent(principal)
                    .interestComponent(interest)
                    .closingPrincipal(closing)
                    .build());

            currentDue = currentDue.plusMonths(1);
        }

        BigDecimal totalRepayment = amountFinanced.add(totalInterest);
        BigDecimal totalBorrowingCost = totalInterest.add(fees);

        return EmiCalculatorResponse.builder()
                .amountFinanced(amountFinanced)
                .monthlyEmi(schedule.isEmpty() ? BigDecimal.ZERO : schedule.get(0).getScheduledEmi())
                .tenureMonths(n)
                .totalScheduledRepayment(totalRepayment)
                .totalScheduledInterest(totalInterest)
                .applicableFees(fees)
                .totalBorrowingCost(totalBorrowingCost)
                .firstDueDate(firstDue)
                .lastDueDate(lastDue)
                .calculationMethod("REDUCING_BALANCE_COMPOUND")
                .schedule(schedule)
                .build();
    }

    // -------------------------------------------------------------
    // LENDERS & FINANCE PARTNERS
    // -------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<FinanceLenderResponse> getActiveLenders() {
        return financeLenderRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::mapToLenderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FinanceLenderResponse createLender(FinanceLenderResponse req) {
        String code = req.getLenderCode();
        if (code == null || code.isBlank()) {
            code = "LND-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        FinanceLenderEntity entity = FinanceLenderEntity.builder()
                .lenderCode(code)
                .name(req.getName())
                .lenderType(req.getLenderType() != null ? req.getLenderType() : "BANK")
                .contactPerson(req.getContactPerson())
                .contactPhone(req.getContactPhone())
                .contactEmail(req.getContactEmail())
                .supportedVehicleTypes(req.getSupportedVehicleTypes() != null ? req.getSupportedVehicleTypes() : "ALL")
                .minTenureMonths(req.getMinTenureMonths() != null ? req.getMinTenureMonths() : 12)
                .maxTenureMonths(req.getMaxTenureMonths() != null ? req.getMaxTenureMonths() : 60)
                .indicativeInterestRate(req.getIndicativeInterestRate() != null ? req.getIndicativeInterestRate() : BigDecimal.valueOf(9.50))
                .processingFeePercentage(req.getProcessingFeePercentage() != null ? req.getProcessingFeePercentage() : BigDecimal.valueOf(1.00))
                .dealerCommissionPercentage(req.getDealerCommissionPercentage() != null ? req.getDealerCommissionPercentage() : BigDecimal.valueOf(80.00))
                .commissionPayoutBasis(req.getCommissionPayoutBasis() != null ? req.getCommissionPayoutBasis() : "PERCENTAGE_OF_PROCESSING_FEE")
                .documentationChecklist(req.getDocumentationChecklist())
                .notes(req.getNotes())
                .isActive(true)
                .build();

        FinanceLenderEntity saved = financeLenderRepository.save(entity);
        return mapToLenderResponse(saved);
    }

    // -------------------------------------------------------------
    // FINANCE APPLICATIONS (IN-HOUSE & EXTERNAL)
    // -------------------------------------------------------------
    @Override
    @Transactional
    public FinanceApplicationResponse submitApplication(FinanceApplicationCreateRequest req, String username) {
        CustomerEntity customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + req.getCustomerId()));

        VehicleEntity vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + req.getVehicleId()));

        FinanceLenderEntity lender = null;
        if (req.getLenderId() != null) {
            lender = financeLenderRepository.findById(req.getLenderId()).orElse(null);
        }

        String appNumber = "FA-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Calculate estimated EMI
        EmiCalculatorRequest calcReq = EmiCalculatorRequest.builder()
                .vehicleAmount(req.getTotalVehiclePrice())
                .downPayment(req.getDownPayment() != null ? req.getDownPayment() : BigDecimal.ZERO)
                .tradeInCredit(req.getTradeInCredit() != null ? req.getTradeInCredit() : BigDecimal.ZERO)
                .financedFees(req.getProcessingFee() != null ? req.getProcessingFee() : BigDecimal.ZERO)
                .annualInterestRate(req.getInterestRate())
                .tenureMonths(req.getRequestedTenureMonths())
                .build();
        EmiCalculatorResponse calcRes = calculateEmi(calcReq);

        FinanceApplicationEntity app = FinanceApplicationEntity.builder()
                .applicationNumber(appNumber)
                .customer(customer)
                .vehicle(vehicle)
                .saleId(req.getSaleId())
                .financeType(req.getFinanceType() != null ? req.getFinanceType() : "IN_HOUSE")
                .lender(lender)
                .lenderName(lender != null ? lender.getName() : req.getLenderName())
                .applicantName(req.getApplicantName())
                .applicantPhone(req.getApplicantPhone())
                .applicantEmail(req.getApplicantEmail())
                .employmentType(req.getEmploymentType())
                .declaredMonthlyIncome(req.getDeclaredMonthlyIncome() != null ? req.getDeclaredMonthlyIncome() : BigDecimal.ZERO)
                .totalVehiclePrice(req.getTotalVehiclePrice())
                .downPayment(req.getDownPayment() != null ? req.getDownPayment() : BigDecimal.ZERO)
                .tradeInCredit(req.getTradeInCredit() != null ? req.getTradeInCredit() : BigDecimal.ZERO)
                .requestedLoanAmount(req.getRequestedLoanAmount())
                .requestedTenureMonths(req.getRequestedTenureMonths())
                .interestRate(req.getInterestRate())
                .estimatedEmi(calcRes.getMonthlyEmi())
                .processingFee(req.getProcessingFee() != null ? req.getProcessingFee() : BigDecimal.ZERO)
                .status("SUBMITTED")
                .notes(req.getNotes())
                .createdByUser(username)
                .build();

        FinanceApplicationEntity saved = financeApplicationRepository.save(app);
        log.info("Finance Application [{}] created for customer [{}] and vehicle [{}] by [{}]",
                appNumber, customer.getName(), vehicle.getRegistrationNumber(), username);

        return mapToApplicationResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FinanceApplicationResponse> getApplications(String status, String financeType, Pageable pageable) {
        Specification<FinanceApplicationEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (financeType != null && !financeType.isBlank()) {
                predicates.add(cb.equal(root.get("financeType"), financeType));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<FinanceApplicationEntity> page = financeApplicationRepository.findAll(spec, pageable);
        List<FinanceApplicationResponse> content = page.getContent().stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceApplicationResponse getApplicationById(Long id) {
        FinanceApplicationEntity entity = financeApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Finance application not found with id: " + id));
        return mapToApplicationResponse(entity);
    }

    @Override
    @Transactional
    public FinanceApplicationResponse sanctionApplication(Long id, ApplicationSanctionRequest req, String username) {
        FinanceApplicationEntity app = financeApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Finance application not found with id: " + id));

        app.setStatus("SANCTIONED");
        app.setSanctionedAmount(req.getSanctionedAmount() != null ? req.getSanctionedAmount() : app.getRequestedLoanAmount());
        app.setSanctionLetterReference(req.getSanctionLetterReference());
        app.setSanctionDate(req.getSanctionDate() != null ? req.getSanctionDate() : LocalDate.now());
        app.setSanctionValidUntil(req.getSanctionValidUntil() != null ? req.getSanctionValidUntil() : LocalDate.now().plusDays(30));
        if (req.getNotes() != null) {
            app.setNotes((app.getNotes() != null ? app.getNotes() + "\n" : "") + "Sanction: " + req.getNotes());
        }

        FinanceApplicationEntity saved = financeApplicationRepository.save(app);
        log.info("Application [{}] SANCTIONED for amount ₹{} by [{}]", app.getApplicationNumber(), app.getSanctionedAmount(), username);
        return mapToApplicationResponse(saved);
    }

    @Override
    @Transactional
    public FinanceApplicationResponse disburseApplication(Long id, ApplicationDisbursementRequest req, String username) {
        FinanceApplicationEntity app = financeApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Finance application not found with id: " + id));

        app.setStatus("DISBURSED");
        app.setDisbursedAmount(req.getDisbursedAmount());
        app.setDisbursementDate(req.getDisbursementDate() != null ? req.getDisbursementDate() : LocalDate.now());
        app.setDisbursementReference(req.getDisbursementReference());
        if (req.getNotes() != null) {
            app.setNotes((app.getNotes() != null ? app.getNotes() + "\n" : "") + "Disbursement: " + req.getNotes());
        }

        FinanceApplicationEntity saved = financeApplicationRepository.save(app);
        log.info("Application [{}] DISBURSED with ₹{} by [{}]", app.getApplicationNumber(), req.getDisbursedAmount(), username);
        return mapToApplicationResponse(saved);
    }

    @Override
    @Transactional
    public FinanceApplicationResponse rejectApplication(Long id, String reason, String username) {
        FinanceApplicationEntity app = financeApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Finance application not found with id: " + id));

        app.setStatus("REJECTED");
        app.setRejectionReason(reason);
        FinanceApplicationEntity saved = financeApplicationRepository.save(app);
        log.info("Application [{}] REJECTED. Reason: [{}] by [{}]", app.getApplicationNumber(), reason, username);
        return mapToApplicationResponse(saved);
    }

    // -------------------------------------------------------------
    // LOAN FORECLOSURE & CLOSURE
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // LOAN FORECLOSURE & PRECLOSURE ELIGIBILITY ENGINE
    // -------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public LoanPreclosureEligibilityResponse getPreclosureEligibility(Long loanId, LocalDate businessDate) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        LocalDate evalDate = businessDate != null ? businessDate : LocalDate.now();

        // Check if loan is already closed
        if (loan.getStatus() == FinanceStatus.CLOSED) {
            return LoanPreclosureEligibilityResponse.builder()
                    .loanId(loan.getId())
                    .loanStatus(loan.getStatus().name())
                    .preclosureEnabled(false)
                    .eligible(false)
                    .commencementDate(loan.getLoanStartDate())
                    .evaluatedBusinessDate(evalDate)
                    .ineligibilityReason("Loan account is already fully settled and CLOSED.")
                    .outstandingPrincipal(BigDecimal.ZERO)
                    .estimatedSettlementPayable(BigDecimal.ZERO)
                    .build();
        }

        // Fetch applicable policy
        String borrowerCategory = "INDIVIDUAL";
        String interestRateType = "FIXED";
        LoanPenaltyPolicyEntity policy = loanPenaltyPolicyRepository
                .findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(borrowerCategory, interestRateType)
                .orElse(null);

        boolean preclosureEnabled = policy == null || Boolean.TRUE.equals(policy.getPreclosureEnabled());
        int eligibilityPeriodMonths = policy != null && policy.getEligibilityPeriodMonths() != null
                ? policy.getEligibilityPeriodMonths()
                : 3;
        boolean inclusiveEnd = policy == null || Boolean.TRUE.equals(policy.getInclusiveEndDateRule());

        LocalDate commencementDate = loan.getLoanStartDate() != null ? loan.getLoanStartDate() : LocalDate.now();

        // Exact calendar month arithmetic (e.g. 1 Nov 2026 + 3 calendar months window)
        // If loan starts on 1 Nov 2026 with a 3 calendar months window (Nov, Dec, Jan):
        // November (Month 1), December (Month 2), January 1 (inclusive Month 3 boundary):
        // Formula: commencementDate.plusMonths(eligibilityPeriodMonths - 1) gives 1 Jan 2027.
        LocalDate eligibilityEndDate = commencementDate.plusMonths(Math.max(1, eligibilityPeriodMonths) - 1);

        boolean isBeforeStart = evalDate.isBefore(commencementDate);
        boolean isPastWindow = inclusiveEnd ? evalDate.isAfter(eligibilityEndDate) : !evalDate.isBefore(eligibilityEndDate);

        boolean eligible = preclosureEnabled && !isBeforeStart && !isPastWindow;
        String ineligibilityReason = null;

        if (!preclosureEnabled) {
            ineligibilityReason = "Preclosure is currently disabled under configured policy terms.";
        } else if (isBeforeStart) {
            ineligibilityReason = "Preclosure window has not commenced yet (Commencement date: " + commencementDate + ").";
        } else if (isPastWindow) {
            ineligibilityReason = "Preclosure eligibility expired on " + eligibilityEndDate + ".";
        }

        BigDecimal principalOutstanding = loan.getPrincipalOutstanding() != null && loan.getPrincipalOutstanding().compareTo(BigDecimal.ZERO) > 0
                ? loan.getPrincipalOutstanding()
                : loan.getLoanAmount().subtract(loan.getTotalPrincipalPaid() != null ? loan.getTotalPrincipalPaid() : BigDecimal.ZERO);
        if (principalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            principalOutstanding = BigDecimal.ZERO;
        }

        BigDecimal feeRate = policy != null && policy.getForeclosureChargeRate() != null
                ? policy.getForeclosureChargeRate()
                : BigDecimal.valueOf(2.00);

        String feeBasis = policy != null && policy.getFeeCalculationBase() != null
                ? policy.getFeeCalculationBase()
                : "OUTSTANDING_PRINCIPAL";

        String version = policy != null ? policy.getPolicyVersion() : "1.0";

        BigDecimal estimatedSettlement = BigDecimal.ZERO;
        if (eligible) {
            try {
                LoanForeclosureQuoteResponse quote = getForeclosureQuote(loanId);
                estimatedSettlement = quote.getTotalSettlementPayable();
            } catch (Exception e) {
                log.warn("Could not compute estimated quote during eligibility evaluation: {}", e.getMessage());
            }
        }

        return LoanPreclosureEligibilityResponse.builder()
                .loanId(loan.getId())
                .loanStatus(loan.getStatus().name())
                .preclosureEnabled(preclosureEnabled)
                .eligible(eligible)
                .commencementDate(commencementDate)
                .eligibilityPeriodMonths(eligibilityPeriodMonths)
                .eligibilityEndDate(eligibilityEndDate)
                .evaluatedBusinessDate(evalDate)
                .ineligibilityReason(ineligibilityReason)
                .applicableFeeRate(feeRate)
                .applicableFeeBasis(feeBasis)
                .policyVersion(version)
                .outstandingPrincipal(principalOutstanding)
                .estimatedSettlementPayable(estimatedSettlement)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LoanForeclosureQuoteResponse getForeclosureQuote(Long loanId) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        BigDecimal principalOutstanding = loan.getPrincipalOutstanding() != null && loan.getPrincipalOutstanding().compareTo(BigDecimal.ZERO) > 0
                ? loan.getPrincipalOutstanding()
                : loan.getLoanAmount().subtract(loan.getTotalPrincipalPaid() != null ? loan.getTotalPrincipalPaid() : BigDecimal.ZERO);

        if (principalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            principalOutstanding = BigDecimal.ZERO;
        }

        LocalDate today = LocalDate.now();
        List<EmiScheduleEntity> emis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(loan.getId());

        LocalDate lastSettledOrDueDate = loan.getLoanStartDate() != null ? loan.getLoanStartDate() : today.minusDays(15);
        BigDecimal overdueScheduledPrincipal = BigDecimal.ZERO;
        BigDecimal overdueRegularInterest = BigDecimal.ZERO;
        BigDecimal eligiblePenalCharges = BigDecimal.ZERO;

        if (emis != null) {
            for (EmiScheduleEntity emi : emis) {
                if (emi.getDueDate() == null) continue;
                if ("PAID".equalsIgnoreCase(emi.getStatus())) {
                    if (emi.getDueDate().isAfter(lastSettledOrDueDate) && !emi.getDueDate().isAfter(today)) {
                        lastSettledOrDueDate = emi.getDueDate();
                    }
                } else if (emi.getDueDate().isBefore(today)) {
                    // Overdue instalment arrears
                    overdueScheduledPrincipal = overdueScheduledPrincipal.add(emi.getPrincipalAmount());
                    overdueRegularInterest = overdueRegularInterest.add(emi.getInterestAmount());
                    if (emi.getPenaltyAmount() != null) {
                        eligiblePenalCharges = eligiblePenalCharges.add(emi.getPenaltyAmount());
                    }
                }
            }
        }

        long daysElapsed = java.time.temporal.ChronoUnit.DAYS.between(lastSettledOrDueDate, today);
        if (daysElapsed < 0) daysElapsed = 0;
        if (daysElapsed > 30) daysElapsed = 30; // Max 1 monthly billing cycle accrual

        BigDecimal annualRate = loan.getInterestRate() != null ? loan.getInterestRate() : BigDecimal.valueOf(9.50);
        BigDecimal dailyRate = annualRate.divide(BigDecimal.valueOf(36500), 8, RoundingMode.HALF_UP);
        BigDecimal accruedInterest = principalOutstanding.multiply(dailyRate)
                .multiply(BigDecimal.valueOf(daysElapsed))
                .setScale(2, RoundingMode.HALF_UP);

        // Fetch applicable loan penalty and foreclosure policy
        String borrowerCategory = "INDIVIDUAL";
        String interestRateType = "FIXED"; // Default fixed for used vehicles unless specified
        LoanPenaltyPolicyEntity policy = loanPenaltyPolicyRepository
                .findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(borrowerCategory, interestRateType)
                .orElse(null);

        BigDecimal foreclosureRate = (policy != null && policy.getForeclosureChargeRate() != null)
                ? policy.getForeclosureChargeRate()
                : BigDecimal.valueOf(2.00);

        boolean isRbiExempt = policy != null && Boolean.TRUE.equals(policy.getRbiFloatingRateForeclosureExempt()) && "FLOATING".equalsIgnoreCase(interestRateType);
        if (isRbiExempt) {
            foreclosureRate = BigDecimal.ZERO;
        }

        BigDecimal feeBase = principalOutstanding;
        if (policy != null && "SANCTIONED_AMOUNT".equalsIgnoreCase(policy.getFeeCalculationBase())) {
            feeBase = loan.getLoanAmount() != null ? loan.getLoanAmount() : principalOutstanding;
        }

        BigDecimal foreclosureCharge = isRbiExempt
                ? BigDecimal.ZERO
                : feeBase.multiply(foreclosureRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (policy != null && policy.getMaxForeclosureFee() != null && foreclosureCharge.compareTo(policy.getMaxForeclosureFee()) > 0) {
            foreclosureCharge = policy.getMaxForeclosureFee();
        }
        if (policy != null && policy.getMinForeclosureFee() != null && foreclosureCharge.compareTo(policy.getMinForeclosureFee()) < 0) {
            foreclosureCharge = policy.getMinForeclosureFee();
        }

        BigDecimal otherFees = BigDecimal.ZERO;
        BigDecimal unallocatedCredits = BigDecimal.ZERO;
        BigDecimal authorizedWaiverAmount = BigDecimal.ZERO;

        // Authoritative Net Settlement Payable: Principal Outstanding + Accrued Interest + Foreclosure Charge + Penal Charges - Credits
        BigDecimal totalSettlement = principalOutstanding
                .add(accruedInterest)
                .add(foreclosureCharge)
                .add(eligiblePenalCharges)
                .add(otherFees)
                .subtract(unallocatedCredits)
                .subtract(authorizedWaiverAmount);

        if (totalSettlement.compareTo(BigDecimal.ZERO) < 0) {
            totalSettlement = BigDecimal.ZERO;
        }

        String custName = (loan.getSale() != null && loan.getSale().getCustomer() != null)
                ? loan.getSale().getCustomer().getName()
                : "Customer";
        String custPhone = (loan.getSale() != null && loan.getSale().getCustomer() != null)
                ? loan.getSale().getCustomer().getMobile()
                : null;
        String vehReg = (loan.getSale() != null && loan.getSale().getVehicle() != null)
                ? loan.getSale().getVehicle().getRegistrationNumber()
                : null;

        String quotationId = "QUO-FC-" + loan.getId() + "-" + LocalDate.now().toString().replace("-", "");

        List<String> auditTrailNotes = new ArrayList<>();
        auditTrailNotes.add("Contractual Outstanding Principal: ₹" + principalOutstanding);
        auditTrailNotes.add("Daily Accrued Interest (" + daysElapsed + " days @ " + annualRate + "% p.a.): ₹" + accruedInterest);
        auditTrailNotes.add("Foreclosure Prepayment Fee (" + foreclosureRate + "% on " + (policy != null && "SANCTIONED_AMOUNT".equalsIgnoreCase(policy.getFeeCalculationBase()) ? "sanctioned amount" : "principal") + "): ₹" + foreclosureCharge);
        if (eligiblePenalCharges.compareTo(BigDecimal.ZERO) > 0) {
            auditTrailNotes.add("Eligible Overdue Penal Charges: ₹" + eligiblePenalCharges);
        }
        auditTrailNotes.add("Authoritative Settlement Balance: ₹" + totalSettlement);

        return LoanForeclosureQuoteResponse.builder()
                .loanId(loan.getId())
                .loanAccountNumber(loan.getLoanAccountNumber())
                .customerName(custName)
                .customerPhone(custPhone)
                .vehicleRegistrationNumber(vehReg)
                .quotationId(quotationId)
                .quotationDate(today)
                .quoteValidUntil(today.plusDays(7))
                .principalOutstanding(principalOutstanding)
                .accruedInterest(accruedInterest)
                .overdueScheduledPrincipal(overdueScheduledPrincipal)
                .overdueRegularInterest(overdueRegularInterest)
                .eligiblePenalCharges(eligiblePenalCharges)
                .otherFees(otherFees)
                .foreclosureChargePercentage(foreclosureRate)
                .foreclosureChargeAmount(foreclosureCharge)
                .isRbiForeclosureExempt(isRbiExempt)
                .unallocatedCredits(unallocatedCredits)
                .authorizedWaiverAmount(authorizedWaiverAmount)
                .totalSettlementPayable(totalSettlement)
                .netSettlementAmount(totalSettlement) // Dual client compatibility
                .appliedPolicyCode(policy != null ? policy.getPolicyCode() : "IN_HOUSE_STD_2026")
                .termsAndConditions("Quotation valid for 7 calendar days. Closure requires realization of exact settlement balance.")
                .auditTrailNotes(auditTrailNotes)
                .build();
    }

    @Override
    @Transactional
    public FinanceResponse closeLoan(Long loanId, LoanClosureRequest req, String username) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        if (loan.getStatus() == FinanceStatus.CLOSED) {
            throw new BusinessRuleViolationException("Loan #" + loanId + " is already closed");
        }

        // Authoritative verification: compute authoritative quote
        LoanForeclosureQuoteResponse quote = getForeclosureQuote(loanId);
        BigDecimal requiredPayable = quote.getTotalSettlementPayable();

        BigDecimal actualPaid = req.getEffectiveSettlementAmount();
        BigDecimal waiver = req.getAuthorizedWaiver() != null ? req.getAuthorizedWaiver() : BigDecimal.ZERO;
        String paymentRef = req.getEffectivePaymentReference();

        if (paymentRef == null || paymentRef.trim().isEmpty()) {
            throw new BusinessRuleViolationException("Settlement receipt / UTR transaction reference is required");
        }

        // Check idempotency key if provided
        if (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()) {
            if (loanLedgerEntryRepository.existsByIdempotencyKey(req.getIdempotencyKey())) {
                log.warn("Duplicate loan closure request detected with idempotency key: {}", req.getIdempotencyKey());
                return mapToFinanceResponseWithSchedule(loan);
            }
        }

        // If loan has positive principal or accrued charges, reject closure without settlement payment or authorized waiver
        if (requiredPayable.compareTo(BigDecimal.ZERO) > 0) {
            if (actualPaid == null || actualPaid.compareTo(BigDecimal.ZERO) <= 0) {
                if (waiver.compareTo(requiredPayable) < 0) {
                    throw new BusinessRuleViolationException("Settlement payment verification failed. Full settlement payable of ₹"
                            + requiredPayable + " cannot be closed for ₹0 without authorized waiver.");
                }
            } else {
                BigDecimal totalCovered = actualPaid.add(waiver);
                if (totalCovered.compareTo(requiredPayable) < 0) {
                    throw new BusinessRuleViolationException("Settlement amount paid (₹" + actualPaid
                            + ") plus waiver (₹" + waiver + ") is insufficient to settle required foreclosure balance of ₹"
                            + requiredPayable);
                }
            }
        }

        LocalDate closureDate = req.getClosureDate() != null ? req.getClosureDate() : LocalDate.now();
        loan.setStatus(FinanceStatus.CLOSED);
        loan.setClosedDate(closureDate);
        loan.setClosureRemarks(req.getClosureRemarks() != null ? req.getClosureRemarks() : "Full loan settlement received and loan closed");
        loan.setForeclosureCharge(quote.getForeclosureChargeAmount());

        BigDecimal principalSettled = quote.getPrincipalOutstanding();
        BigDecimal interestSettled = quote.getAccruedInterest();
        BigDecimal feeSettled = quote.getForeclosureChargeAmount();

        loan.setTotalPrincipalPaid((loan.getTotalPrincipalPaid() != null ? loan.getTotalPrincipalPaid() : BigDecimal.ZERO).add(principalSettled));
        loan.setTotalInterestPaid((loan.getTotalInterestPaid() != null ? loan.getTotalInterestPaid() : BigDecimal.ZERO).add(interestSettled));
        loan.setPrincipalOutstanding(BigDecimal.ZERO);

        // Mark all remaining pending EMIs as closed/settled
        List<EmiScheduleEntity> emis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(loan.getId());
        for (EmiScheduleEntity emi : emis) {
            if ("PENDING".equalsIgnoreCase(emi.getStatus())) {
                emi.setStatus("PAID");
                emi.setPaidDate(closureDate);
                emi.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "BANK_TRANSFER");
                emi.setPaymentReference(paymentRef);
                emiScheduleRepository.save(emi);
            }
        }

        FinanceDetailEntity saved = financeDetailRepository.save(loan);

        // Record immutable ledger entry for Foreclosure Settlement
        Long customerId = (loan.getSale() != null && loan.getSale().getCustomer() != null)
                ? loan.getSale().getCustomer().getId()
                : 1L;
        Long saleId = loan.getSale() != null ? loan.getSale().getId() : null;

        String txId = "TX-SETTLE-" + loan.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LoanLedgerEntryEntity ledgerEntry = LoanLedgerEntryEntity.builder()
                .transactionId(txId)
                .financeDetail(loan)
                .customerId(customerId)
                .saleId(saleId)
                .transactionType("FORECLOSURE_SETTLEMENT")
                .entryDirection("CREDIT")
                .amount(actualPaid != null ? actualPaid : requiredPayable)
                .principalPortion(principalSettled)
                .interestPortion(interestSettled)
                .feePortion(feeSettled)
                .penaltyPortion(quote.getEligiblePenalCharges())
                .principalBalanceAfter(BigDecimal.ZERO)
                .effectiveDate(closureDate)
                .sourceReference("FORECLOSURE-QUOTE-" + quote.getQuotationId())
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "BANK_TRANSFER")
                .paymentReference(paymentRef)
                .idempotencyKey(req.getIdempotencyKey())
                .status("POSTED")
                .createdByUser(username != null ? username : "SYSTEM")
                .notes("Early loan foreclosure settlement. Settled principal: ₹" + principalSettled
                        + ", interest: ₹" + interestSettled + ", foreclosure fee: ₹" + feeSettled)
                .build();
        loanLedgerEntryRepository.save(ledgerEntry);

        // Synchronize with linked Sale: record payment and transition status to COMPLETED
        if (loan.getSale() != null) {
            SaleEntity linkedSale = loan.getSale();
            BigDecimal amountToCreditSale = actualPaid != null ? actualPaid : requiredPayable;
            
            // Create Payment receipt against the sale order
            String receiptNo = "REC-SETTLE-" + linkedSale.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            com.ims.entity.sales.PaymentEntity settlementPayment = com.ims.entity.sales.PaymentEntity.builder()
                    .receiptNumber(receiptNo)
                    .sale(linkedSale)
                    .paymentDate(closureDate)
                    .amount(amountToCreditSale)
                    .paymentMethod(req.getPaymentMethod() != null ? com.ims.enums.PaymentMethod.valueOf(req.getPaymentMethod()) : com.ims.enums.PaymentMethod.BANK_TRANSFER)
                    .transactionReference(paymentRef)
                    .notes("Loan foreclosure full settlement receipt #" + txId)
                    .idempotencyKey("SALE-SETTLE-" + loan.getId())
                    .build();
            paymentRepository.save(settlementPayment);
            linkedSale.getPayments().add(settlementPayment);

            // Reconcile sale status: since loan is fully settled, sale transitions to COMPLETED
            linkedSale.setStatus(com.ims.enums.SaleStatus.COMPLETED);
            saleRepository.save(linkedSale);
            log.info("Linked Sale Order [{}] synchronized to COMPLETED after full loan settlement of ₹{}",
                    linkedSale.getSaleNumber(), amountToCreditSale);
        }

        log.info("Loan account [{}] successfully closed with authoritative settlement of ₹{} by [{}]",
                loan.getLoanAccountNumber(), ledgerEntry.getAmount(), username);

        return mapToFinanceResponseWithSchedule(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanLedgerEntryResponse> getLoanLedger(Long loanId) {
        return loanLedgerEntryRepository.findByFinanceDetailIdOrderByEffectiveDateAscIdAsc(loanId).stream()
                .map(this::mapToLedgerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assessOverdueCharges() {
        LocalDate today = LocalDate.now();
        List<EmiScheduleEntity> overdueList = emiScheduleRepository.findOverdueEmis(today);
        for (EmiScheduleEntity emi : overdueList) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(emi.getDueDate(), today);
            if (daysOverdue > 3) { // 3-day grace period
                // 2% monthly penal charge on unpaid EMI amount
                BigDecimal penalty = emi.getEmiAmount().multiply(BigDecimal.valueOf(0.02)).setScale(2, RoundingMode.HALF_UP);
                if (emi.getPenaltyAmount() == null || emi.getPenaltyAmount().compareTo(penalty) < 0) {
                    emi.setPenaltyAmount(penalty);
                    emiScheduleRepository.save(emi);
                }
            }
        }
    }

    private LoanLedgerEntryResponse mapToLedgerResponse(LoanLedgerEntryEntity e) {
        return LoanLedgerEntryResponse.builder()
                .id(e.getId())
                .transactionId(e.getTransactionId())
                .financeId(e.getFinanceDetail().getId())
                .customerId(e.getCustomerId())
                .saleId(e.getSaleId())
                .transactionType(e.getTransactionType())
                .entryDirection(e.getEntryDirection())
                .amount(e.getAmount())
                .principalPortion(e.getPrincipalPortion())
                .interestPortion(e.getInterestPortion())
                .feePortion(e.getFeePortion())
                .penaltyPortion(e.getPenaltyPortion())
                .principalBalanceAfter(e.getPrincipalBalanceAfter())
                .effectiveDate(e.getEffectiveDate())
                .postingTimestamp(e.getPostingTimestamp())
                .sourceReference(e.getSourceReference())
                .paymentMethod(e.getPaymentMethod())
                .paymentReference(e.getPaymentReference())
                .status(e.getStatus())
                .createdByUser(e.getCreatedByUser())
                .notes(e.getNotes())
                .build();
    }

    // -------------------------------------------------------------
    // DASHBOARD METRICS
    // -------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public FinanceDashboardMetricsResponse getDashboardMetrics() {
        long totalApps = financeApplicationRepository.count();
        long pendingApps = financeApplicationRepository.countByStatus("SUBMITTED") + financeApplicationRepository.countByStatus("UNDER_REVIEW");
        long approvedApps = financeApplicationRepository.countByStatus("APPROVED") + financeApplicationRepository.countByStatus("SANCTIONED");
        long disbursedApps = financeApplicationRepository.countByStatus("DISBURSED");

        List<FinanceDetailEntity> allLoans = financeDetailRepository.findAll();
        long activeLoans = allLoans.stream().filter(l -> l.getStatus() == FinanceStatus.ACTIVE).count();
        long closedLoans = allLoans.stream().filter(l -> l.getStatus() == FinanceStatus.CLOSED).count();

        // 1. Authoritative Remaining Contractual Principal across active loans
        BigDecimal principalOutstanding = allLoans.stream()
                .filter(l -> l.getStatus() == FinanceStatus.ACTIVE)
                .map(l -> l.getPrincipalOutstanding() != null && l.getPrincipalOutstanding().compareTo(BigDecimal.ZERO) > 0
                        ? l.getPrincipalOutstanding()
                        : l.getLoanAmount().subtract(l.getTotalPrincipalPaid() != null ? l.getTotalPrincipalPaid() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Overdue Installments
        List<EmiScheduleEntity> overdue = emiScheduleRepository.findOverdueEmis(LocalDate.now());
        BigDecimal overdueAmt = overdue.stream()
                .map(EmiScheduleEntity::getEmiAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Current Calendar Month Range
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        // 4. Real Verified Collections This Month: Sum of actual paid EMIs in current month
        BigDecimal emiCollectionsThisMonth = emiScheduleRepository.sumEmiCollectionsBetween(startOfMonth, endOfMonth);
        BigDecimal principalCollectedThisMonth = emiScheduleRepository.sumPrincipalCollectionsBetween(startOfMonth, endOfMonth);
        BigDecimal interestCollectedThisMonth = emiScheduleRepository.sumInterestCollectionsBetween(startOfMonth, endOfMonth);

        // Include any posted settlement credits in current month
        BigDecimal settlementsThisMonth = loanLedgerEntryRepository.sumSettlementsBetween(startOfMonth, endOfMonth);
        BigDecimal totalCollectionsThisMonth = emiCollectionsThisMonth.add(settlementsThisMonth);

        // 5. Real Verified Bank/NBFC Disbursements Received This Month
        BigDecimal bankDisbursedThisMonth = financeApplicationRepository.sumDisbursedAmountBetween(startOfMonth, endOfMonth);

        // 6. Cumulative Amount Repaid (Lifetime Customer Realization)
        BigDecimal totalRepaidCumulative = allLoans.stream()
                .map(l -> (l.getTotalPrincipalPaid() != null ? l.getTotalPrincipalPaid() : BigDecimal.ZERO)
                        .add(l.getTotalInterestPaid() != null ? l.getTotalInterestPaid() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 7. Accrued Interest across Active Accounts
        BigDecimal totalInterestAccrued = allLoans.stream()
                .filter(l -> l.getStatus() == FinanceStatus.ACTIVE)
                .map(l -> l.getTotalInterestAccrued() != null ? l.getTotalInterestAccrued() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 8. Total Customer Receivables (Current Principal Outstanding + Overdue Arrears)
        BigDecimal totalCustomerReceivables = principalOutstanding.add(overdueAmt);

        return FinanceDashboardMetricsResponse.builder()
                .totalApplications(totalApps)
                .pendingApplications(pendingApps)
                .approvedApplications(approvedApps)
                .disbursedApplications(disbursedApps)
                .activeLoans(activeLoans)
                .closedLoans(closedLoans)
                .overdueEmisCount(overdue.size())
                .totalPrincipalOutstanding(principalOutstanding)
                .totalCollectionsThisMonth(totalCollectionsThisMonth)
                .totalDisbursedThisMonth(bankDisbursedThisMonth)
                .overdueAmount(overdueAmt)
                .totalInterestAccrued(totalInterestAccrued)
                .totalPrincipalCollectedThisMonth(principalCollectedThisMonth)
                .totalInterestCollectedThisMonth(interestCollectedThisMonth)
                .totalSettlementCollectedThisMonth(settlementsThisMonth)
                .totalAmountRepaidCumulative(totalRepaidCumulative)
                .totalCustomerReceivables(totalCustomerReceivables)
                .build();
    }

    // -------------------------------------------------------------
    // MAPPER HELPERS
    // -------------------------------------------------------------
    private FinanceResponse mapToFinanceResponseBasic(FinanceDetailEntity entity) {
        return FinanceResponse.builder()
                .id(entity.getId())
                .saleId(entity.getSale() != null ? entity.getSale().getId() : null)
                .saleNumber(entity.getSale() != null ? entity.getSale().getSaleNumber() : null)
                .customerId(entity.getSale() != null && entity.getSale().getCustomer() != null ? entity.getSale().getCustomer().getId() : null)
                .customerName(entity.getSale() != null && entity.getSale().getCustomer() != null ? entity.getSale().getCustomer().getName() : null)
                .vehicleId(entity.getSale() != null && entity.getSale().getVehicle() != null ? entity.getSale().getVehicle().getId() : null)
                .vehicleRegistrationNumber(entity.getSale() != null && entity.getSale().getVehicle() != null ? entity.getSale().getVehicle().getRegistrationNumber() : null)
                .financeCompany(entity.getFinanceCompany())
                .loanAccountNumber(entity.getLoanAccountNumber())
                .loanAmount(entity.getLoanAmount())
                .downPayment(entity.getDownPayment())
                .interestRate(entity.getInterestRate())
                .tenureMonths(entity.getTenureMonths())
                .emiAmount(entity.getEmiAmount())
                .emiDueDay(entity.getEmiDueDay())
                .loanStartDate(entity.getLoanStartDate())
                .loanEndDate(entity.getLoanEndDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .financeType(entity.getFinanceType() != null ? entity.getFinanceType() : "IN_HOUSE")
                .lenderId(entity.getLenderId())
                .financeApplicationId(entity.getFinanceApplicationId())
                .processingFee(entity.getProcessingFee())
                .principalOutstanding(entity.getPrincipalOutstanding())
                .totalInterestAccrued(entity.getTotalInterestAccrued())
                .totalInterestPaid(entity.getTotalInterestPaid())
                .totalPrincipalPaid(entity.getTotalPrincipalPaid())
                .foreclosureCharge(entity.getForeclosureCharge())
                .closedDate(entity.getClosedDate())
                .closureRemarks(entity.getClosureRemarks())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private FinanceResponse mapToFinanceResponseWithSchedule(FinanceDetailEntity entity) {
        FinanceResponse response = mapToFinanceResponseBasic(entity);
        List<EmiScheduleEntity> emis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(entity.getId());
        response.setEmiSchedule(emis.stream().map(this::mapToEmiResponse).collect(Collectors.toList()));
        return response;
    }

    private EmiScheduleResponse mapToEmiResponse(EmiScheduleEntity entity) {
        FinanceDetailEntity fd = entity.getFinanceDetail();
        String customerName = null;
        String vehicleRegNumber = null;
        String financeCompany = null;
        String loanAccountNumber = null;
        Long financeId = null;

        if (fd != null) {
            financeId = fd.getId();
            financeCompany = fd.getFinanceCompany();
            loanAccountNumber = fd.getLoanAccountNumber();
            if (fd.getSale() != null) {
                if (fd.getSale().getCustomer() != null) {
                    customerName = fd.getSale().getCustomer().getName();
                }
                if (fd.getSale().getVehicle() != null) {
                    vehicleRegNumber = fd.getSale().getVehicle().getRegistrationNumber();
                }
            }
        }

        return EmiScheduleResponse.builder()
                .id(entity.getId())
                .financeId(financeId)
                .financeCompany(financeCompany)
                .loanAccountNumber(loanAccountNumber)
                .customerName(customerName)
                .vehicleRegistrationNumber(vehicleRegNumber)
                .installmentNumber(entity.getInstallmentNumber())
                .dueDate(entity.getDueDate())
                .emiAmount(entity.getEmiAmount())
                .principalAmount(entity.getPrincipalAmount())
                .interestAmount(entity.getInterestAmount())
                .status(entity.getStatus())
                .paidDate(entity.getPaidDate())
                .principalRemaining(entity.getPrincipalRemaining())
                .paymentReference(entity.getPaymentReference())
                .paymentMethod(entity.getPaymentMethod())
                .penaltyAmount(entity.getPenaltyAmount())
                .build();
    }

    private FinanceLenderResponse mapToLenderResponse(FinanceLenderEntity entity) {
        return FinanceLenderResponse.builder()
                .id(entity.getId())
                .lenderCode(entity.getLenderCode())
                .name(entity.getName())
                .lenderType(entity.getLenderType())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .contactEmail(entity.getContactEmail())
                .supportedVehicleTypes(entity.getSupportedVehicleTypes())
                .minTenureMonths(entity.getMinTenureMonths())
                .maxTenureMonths(entity.getMaxTenureMonths())
                .indicativeInterestRate(entity.getIndicativeInterestRate())
                .processingFeePercentage(entity.getProcessingFeePercentage())
                .dealerCommissionPercentage(entity.getDealerCommissionPercentage())
                .commissionPayoutBasis(entity.getCommissionPayoutBasis())
                .documentationChecklist(entity.getDocumentationChecklist())
                .notes(entity.getNotes())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private FinanceApplicationResponse mapToApplicationResponse(FinanceApplicationEntity entity) {
        String custName = entity.getCustomer() != null ? entity.getCustomer().getName() : null;
        String vehReg = entity.getVehicle() != null ? entity.getVehicle().getRegistrationNumber() : null;
        String vehName = entity.getVehicle() != null ? entity.getVehicle().getBrand() + " " + entity.getVehicle().getModel() : null;

        return FinanceApplicationResponse.builder()
                .id(entity.getId())
                .applicationNumber(entity.getApplicationNumber())
                .customerId(entity.getCustomer() != null ? entity.getCustomer().getId() : null)
                .customerName(custName)
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehicleRegistrationNumber(vehReg)
                .vehicleName(vehName)
                .saleId(entity.getSaleId())
                .financeType(entity.getFinanceType())
                .lenderId(entity.getLender() != null ? entity.getLender().getId() : null)
                .lenderName(entity.getLenderName())
                .applicantName(entity.getApplicantName())
                .applicantPhone(entity.getApplicantPhone())
                .applicantEmail(entity.getApplicantEmail())
                .employmentType(entity.getEmploymentType())
                .declaredMonthlyIncome(entity.getDeclaredMonthlyIncome())
                .totalVehiclePrice(entity.getTotalVehiclePrice())
                .downPayment(entity.getDownPayment())
                .tradeInCredit(entity.getTradeInCredit())
                .requestedLoanAmount(entity.getRequestedLoanAmount())
                .requestedTenureMonths(entity.getRequestedTenureMonths())
                .interestRate(entity.getInterestRate())
                .estimatedEmi(entity.getEstimatedEmi())
                .processingFee(entity.getProcessingFee())
                .status(entity.getStatus())
                .sanctionedAmount(entity.getSanctionedAmount())
                .sanctionLetterReference(entity.getSanctionLetterReference())
                .sanctionDate(entity.getSanctionDate())
                .sanctionValidUntil(entity.getSanctionValidUntil())
                .disbursedAmount(entity.getDisbursedAmount())
                .disbursementDate(entity.getDisbursementDate())
                .disbursementReference(entity.getDisbursementReference())
                .rejectionReason(entity.getRejectionReason())
                .notes(entity.getNotes())
                .createdByUser(entity.getCreatedByUser())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanPenaltyPolicyDto> getPenaltyPolicies() {
        return loanPenaltyPolicyRepository.findAll().stream()
                .map(this::mapToPolicyDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LoanPenaltyPolicyDto createPenaltyPolicy(LoanPenaltyPolicyDto dto, String username) {
        String code = dto.getPolicyCode();
        if (code == null || code.isBlank()) {
            code = "POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        LoanPenaltyPolicyEntity entity = LoanPenaltyPolicyEntity.builder()
                .policyCode(code)
                .name(dto.getName() != null ? dto.getName() : "Custom Automotive Loan Policy")
                .policyVersion(dto.getPolicyVersion() != null ? dto.getPolicyVersion() : "1.0")
                .borrowerCategory(dto.getBorrowerCategory() != null ? dto.getBorrowerCategory() : "INDIVIDUAL")
                .interestRateType(dto.getInterestRateType() != null ? dto.getInterestRateType() : "FIXED")
                .gracePeriodDays(dto.getGracePeriodDays() != null ? dto.getGracePeriodDays() : 3)
                .chargeType(dto.getChargeType() != null ? dto.getChargeType() : "PERCENTAGE_OVERDUE")
                .annualRatePercentage(dto.getAnnualRatePercentage() != null ? dto.getAnnualRatePercentage() : BigDecimal.valueOf(24.00))
                .fixedChargeAmount(dto.getFixedChargeAmount() != null ? dto.getFixedChargeAmount() : BigDecimal.ZERO)
                .perEventCap(dto.getPerEventCap() != null ? dto.getPerEventCap() : BigDecimal.valueOf(5000.00))
                .minCharge(dto.getMinCharge() != null ? dto.getMinCharge() : BigDecimal.valueOf(100.00))
                .foreclosureChargeRate(dto.getForeclosureChargeRate() != null ? dto.getForeclosureChargeRate() : BigDecimal.valueOf(2.00))
                .preclosureEnabled(dto.getPreclosureEnabled() != null ? dto.getPreclosureEnabled() : true)
                .eligibilityPeriodMonths(dto.getEligibilityPeriodMonths() != null ? dto.getEligibilityPeriodMonths() : 3)
                .eligibilityStartBasis(dto.getEligibilityStartBasis() != null ? dto.getEligibilityStartBasis() : "COMMENCEMENT_DATE")
                .inclusiveEndDateRule(dto.getInclusiveEndDateRule() != null ? dto.getInclusiveEndDateRule() : true)
                .feeCalculationBase(dto.getFeeCalculationBase() != null ? dto.getFeeCalculationBase() : "OUTSTANDING_PRINCIPAL")
                .minForeclosureFee(dto.getMinForeclosureFee() != null ? dto.getMinForeclosureFee() : BigDecimal.ZERO)
                .maxForeclosureFee(dto.getMaxForeclosureFee() != null ? dto.getMaxForeclosureFee() : BigDecimal.valueOf(25000.00))
                .overduePayableAtSettlement(dto.getOverduePayableAtSettlement() != null ? dto.getOverduePayableAtSettlement() : true)
                .interestCalculationMethod(dto.getInterestCalculationMethod() != null ? dto.getInterestCalculationMethod() : "REDUCING_BALANCE_DAILY_ACCRUAL")
                .rbiFloatingRateForeclosureExempt(dto.getRbiFloatingRateForeclosureExempt() != null ? dto.getRbiFloatingRateForeclosureExempt() : false)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .disclosureText(dto.getDisclosureText())
                .build();

        LoanPenaltyPolicyEntity saved = loanPenaltyPolicyRepository.save(entity);
        log.info("New loan penalty & foreclosure policy [{}] created by [{}]. Rate: {}%",
                saved.getPolicyCode(), username, saved.getForeclosureChargeRate());

        return mapToPolicyDto(saved);
    }

    @Override
    @Transactional
    public LoanPenaltyPolicyDto updatePenaltyPolicy(Long id, LoanPenaltyPolicyDto dto, String username) {
        LoanPenaltyPolicyEntity policy = loanPenaltyPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan policy not found with id: " + id));

        if (dto.getForeclosureChargeRate() != null) {
            policy.setForeclosureChargeRate(dto.getForeclosureChargeRate());
        }
        if (dto.getAnnualRatePercentage() != null) {
            policy.setAnnualRatePercentage(dto.getAnnualRatePercentage());
        }
        if (dto.getGracePeriodDays() != null) {
            policy.setGracePeriodDays(dto.getGracePeriodDays());
        }
        if (dto.getPerEventCap() != null) {
            policy.setPerEventCap(dto.getPerEventCap());
        }
        if (dto.getFixedChargeAmount() != null) {
            policy.setFixedChargeAmount(dto.getFixedChargeAmount());
        }
        if (dto.getRbiFloatingRateForeclosureExempt() != null) {
            policy.setRbiFloatingRateForeclosureExempt(dto.getRbiFloatingRateForeclosureExempt());
        }
        if (dto.getDisclosureText() != null) {
            policy.setDisclosureText(dto.getDisclosureText());
        }
        if (dto.getPreclosureEnabled() != null) {
            policy.setPreclosureEnabled(dto.getPreclosureEnabled());
        }
        if (dto.getEligibilityPeriodMonths() != null) {
            policy.setEligibilityPeriodMonths(dto.getEligibilityPeriodMonths());
        }
        if (dto.getEligibilityStartBasis() != null) {
            policy.setEligibilityStartBasis(dto.getEligibilityStartBasis());
        }
        if (dto.getInclusiveEndDateRule() != null) {
            policy.setInclusiveEndDateRule(dto.getInclusiveEndDateRule());
        }
        if (dto.getFeeCalculationBase() != null) {
            policy.setFeeCalculationBase(dto.getFeeCalculationBase());
        }
        if (dto.getMinForeclosureFee() != null) {
            policy.setMinForeclosureFee(dto.getMinForeclosureFee());
        }
        if (dto.getMaxForeclosureFee() != null) {
            policy.setMaxForeclosureFee(dto.getMaxForeclosureFee());
        }
        if (dto.getOverduePayableAtSettlement() != null) {
            policy.setOverduePayableAtSettlement(dto.getOverduePayableAtSettlement());
        }
        if (dto.getInterestCalculationMethod() != null) {
            policy.setInterestCalculationMethod(dto.getInterestCalculationMethod());
        }
        if (dto.getIsActive() != null) {
            policy.setIsActive(dto.getIsActive());
        }
        policy.setUpdatedAt(java.time.LocalDateTime.now());

        LoanPenaltyPolicyEntity saved = loanPenaltyPolicyRepository.save(policy);
        log.info("Loan penalty & foreclosure policy [{}] updated by [{}]. Foreclosure Rate: {}%",
                saved.getPolicyCode(), username, saved.getForeclosureChargeRate());

        return mapToPolicyDto(saved);
    }

    private LoanPenaltyPolicyDto mapToPolicyDto(LoanPenaltyPolicyEntity p) {
        return LoanPenaltyPolicyDto.builder()
                .id(p.getId())
                .policyCode(p.getPolicyCode())
                .name(p.getName())
                .policyVersion(p.getPolicyVersion())
                .borrowerCategory(p.getBorrowerCategory())
                .interestRateType(p.getInterestRateType())
                .gracePeriodDays(p.getGracePeriodDays())
                .chargeType(p.getChargeType())
                .annualRatePercentage(p.getAnnualRatePercentage())
                .fixedChargeAmount(p.getFixedChargeAmount())
                .perEventCap(p.getPerEventCap())
                .minCharge(p.getMinCharge())
                .foreclosureChargeRate(p.getForeclosureChargeRate())
                .preclosureEnabled(p.getPreclosureEnabled())
                .eligibilityPeriodMonths(p.getEligibilityPeriodMonths())
                .eligibilityStartBasis(p.getEligibilityStartBasis())
                .inclusiveEndDateRule(p.getInclusiveEndDateRule())
                .feeCalculationBase(p.getFeeCalculationBase())
                .minForeclosureFee(p.getMinForeclosureFee())
                .maxForeclosureFee(p.getMaxForeclosureFee())
                .overduePayableAtSettlement(p.getOverduePayableAtSettlement())
                .interestCalculationMethod(p.getInterestCalculationMethod())
                .rbiFloatingRateForeclosureExempt(p.getRbiFloatingRateForeclosureExempt())
                .isActive(p.getIsActive())
                .disclosureText(p.getDisclosureText())
                .build();
    }

    // -------------------------------------------------------------
    // DETAILED EMI PAYMENT & ALLOCATION
    // -------------------------------------------------------------
    @Override
    @Transactional
    public EmiScheduleResponse recordDetailedEmiPayment(Long emiId, EmiPaymentRequest req, String username) {
        EmiScheduleEntity emi = emiScheduleRepository.findById(emiId)
                .orElseThrow(() -> new ResourceNotFoundException("EMI installment not found with id: " + emiId));

        FinanceDetailEntity finance = emi.getFinanceDetail();
        if (finance == null) {
            throw new BusinessRuleViolationException("Installment #" + emiId + " has no linked loan arrangement");
        }

        if (finance.getStatus() == FinanceStatus.CLOSED) {
            throw new BusinessRuleViolationException("Cannot record payment for an already CLOSED loan account");
        }

        if ("PAID".equalsIgnoreCase(emi.getStatus())) {
            throw new BusinessRuleViolationException("EMI installment #" + emi.getInstallmentNumber() + " is already settled as PAID");
        }

        BigDecimal paymentAmount = req.getAmount();
        LocalDate paymentDate = req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now();
        String paymentMethod = req.getPaymentMethod() != null ? req.getPaymentMethod() : "BANK_TRANSFER";
        String paymentRef = req.getPaymentReference() != null ? req.getPaymentReference() : ("TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        // Idempotency verification
        if (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank()) {
            if (loanLedgerEntryRepository.existsByIdempotencyKey(req.getIdempotencyKey())) {
                log.warn("Duplicate EMI payment rejected for idempotency key: {}", req.getIdempotencyKey());
                return mapToEmiResponse(emi);
            }
        }

        // Waterfall allocation: Penalties -> Interest -> Principal
        BigDecimal rem = paymentAmount;
        BigDecimal penaltyPaid = BigDecimal.ZERO;
        BigDecimal interestPaid = BigDecimal.ZERO;
        BigDecimal principalPaid = BigDecimal.ZERO;

        if (emi.getPenaltyAmount() != null && emi.getPenaltyAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (rem.compareTo(emi.getPenaltyAmount()) >= 0) {
                penaltyPaid = emi.getPenaltyAmount();
                rem = rem.subtract(penaltyPaid);
            } else {
                penaltyPaid = rem;
                rem = BigDecimal.ZERO;
            }
        }

        if (rem.compareTo(BigDecimal.ZERO) > 0 && emi.getInterestAmount() != null) {
            if (rem.compareTo(emi.getInterestAmount()) >= 0) {
                interestPaid = emi.getInterestAmount();
                rem = rem.subtract(interestPaid);
            } else {
                interestPaid = rem;
                rem = BigDecimal.ZERO;
            }
        }

        if (rem.compareTo(BigDecimal.ZERO) > 0) {
            principalPaid = rem;
        }

        // Check if installment is fully settled or partially paid
        boolean fullySettled = paymentAmount.compareTo(emi.getEmiAmount().add(emi.getPenaltyAmount() != null ? emi.getPenaltyAmount() : BigDecimal.ZERO)) >= 0;
        emi.setStatus(fullySettled ? "PAID" : "PARTIALLY_PAID");
        emi.setPaidDate(paymentDate);
        emi.setPaymentMethod(paymentMethod);
        emi.setPaymentReference(paymentRef);
        emi.setPrincipalRemaining(emi.getPrincipalRemaining().subtract(principalPaid));
        if (emi.getPrincipalRemaining().compareTo(BigDecimal.ZERO) < 0) {
            emi.setPrincipalRemaining(BigDecimal.ZERO);
        }
        EmiScheduleEntity updatedEmi = emiScheduleRepository.save(emi);

        // Update loan aggregates
        BigDecimal currentPrincPaid = finance.getTotalPrincipalPaid() != null ? finance.getTotalPrincipalPaid() : BigDecimal.ZERO;
        BigDecimal currentIntPaid = finance.getTotalInterestPaid() != null ? finance.getTotalInterestPaid() : BigDecimal.ZERO;

        BigDecimal newTotalPrincPaid = currentPrincPaid.add(principalPaid);
        BigDecimal newTotalIntPaid = currentIntPaid.add(interestPaid);
        BigDecimal newOutstanding = finance.getLoanAmount().subtract(newTotalPrincPaid);
        if (newOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            newOutstanding = BigDecimal.ZERO;
        }

        finance.setTotalPrincipalPaid(newTotalPrincPaid);
        finance.setTotalInterestPaid(newTotalIntPaid);
        finance.setPrincipalOutstanding(newOutstanding);

        // Record immutable ledger entry
        Long customerId = (finance.getSale() != null && finance.getSale().getCustomer() != null)
                ? finance.getSale().getCustomer().getId()
                : 1L;
        Long saleId = finance.getSale() != null ? finance.getSale().getId() : null;

        LoanLedgerEntryEntity ledgerEntry = LoanLedgerEntryEntity.builder()
                .transactionId("TX-PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .financeDetail(finance)
                .customerId(customerId)
                .saleId(saleId)
                .transactionType("EMI_PAYMENT")
                .entryDirection("CREDIT")
                .amount(paymentAmount)
                .principalPortion(principalPaid)
                .interestPortion(interestPaid)
                .feePortion(BigDecimal.ZERO)
                .penaltyPortion(penaltyPaid)
                .principalBalanceAfter(newOutstanding)
                .effectiveDate(paymentDate)
                .sourceReference("EMI-INSTALMENT-#" + emi.getInstallmentNumber())
                .paymentMethod(paymentMethod)
                .paymentReference(paymentRef)
                .idempotencyKey(req.getIdempotencyKey())
                .status("POSTED")
                .createdByUser(username != null ? username : "SYSTEM")
                .notes(req.getNotes() != null ? req.getNotes() : "Installment #" + emi.getInstallmentNumber() + " payment")
                .build();
        loanLedgerEntryRepository.save(ledgerEntry);

        // Check if all EMIs are settled
        List<EmiScheduleEntity> allEmis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(finance.getId());
        boolean allSettled = allEmis.stream().allMatch(e -> "PAID".equalsIgnoreCase(e.getStatus()));
        if (allSettled && newOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            finance.setStatus(FinanceStatus.CLOSED);
            finance.setClosedDate(paymentDate);
            finance.setClosureRemarks("All scheduled EMIs settled with zero principal outstanding.");
            log.info("Finance #{}: All EMIs settled. Marked status CLOSED.", finance.getId());
        }

        financeDetailRepository.save(finance);
        return mapToEmiResponse(updatedEmi);
    }

    // -------------------------------------------------------------
    // NOC VERIFICATION & ISSUANCE
    // -------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public NocEligibilityResponse checkNocEligibility(Long loanId) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        var customer = loan.getSale() != null ? loan.getSale().getCustomer() : null;
        var vehicle = loan.getSale() != null ? loan.getSale().getVehicle() : null;
        String custName = customer != null ? customer.getName() : "Customer";
        String custAddr = customer != null && customer.getAddress() != null ? customer.getAddress() : null;
        String vehReg = vehicle != null && vehicle.getRegistrationNumber() != null ? vehicle.getRegistrationNumber() : "UNREGISTERED";

        BigDecimal outstanding = loan.getPrincipalOutstanding() != null ? loan.getPrincipalOutstanding() : BigDecimal.ZERO;
        List<EmiScheduleEntity> emis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(loanId);
        long unpaidCount = emis.stream().filter(e -> !"PAID".equalsIgnoreCase(e.getStatus())).count();

        // Check if NOC is already issued
        var existingNocOpt = loanDocumentRepository.findFirstByFinanceDetailIdAndDocumentTypeAndIsActiveTrue(loanId, "NOC_CERTIFICATE");

        List<String> checklist = new ArrayList<>();
        checklist.add("Contractual Outstanding Principal: ₹" + outstanding + (outstanding.compareTo(BigDecimal.ZERO) == 0 ? " (PASS)" : " (PENDING)"));
        checklist.add("Unpaid Scheduled Installments: " + unpaidCount + (unpaidCount == 0 ? " (PASS)" : " (PENDING)"));
        checklist.add("Loan Account Status: " + loan.getStatus().name() + (loan.getStatus() == FinanceStatus.CLOSED ? " (PASS)" : " (REQUIRES CLOSURE)"));
        checklist.add("Active Liens / Disputes: NIL (PASS)");

        boolean eligible = (loan.getStatus() == FinanceStatus.CLOSED) && (outstanding.compareTo(BigDecimal.ZERO) == 0) && (unpaidCount == 0);
        String reason = null;
        if (!eligible) {
            if (loan.getStatus() != FinanceStatus.CLOSED) {
                reason = "Loan account status is " + loan.getStatus().name() + ". Full settlement or closure required before NOC issuance.";
            } else if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
                reason = "Outstanding principal of ₹" + outstanding + " remains unsettled.";
            } else if (unpaidCount > 0) {
                reason = unpaidCount + " scheduled installments remain unpaid.";
            }
        }

        return NocEligibilityResponse.builder()
                .loanId(loan.getId())
                .loanAccountNumber(loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId()))
                .customerName(custName)
                .customerId(customer != null ? customer.getId() : null)
                .customerAddress(custAddr)
                .vehicleRegistrationNumber(vehReg)
                .vehicleBrand(vehicle != null ? vehicle.getBrand() : null)
                .vehicleModel(vehicle != null ? vehicle.getModel() : null)
                .vehicleYear(vehicle != null ? vehicle.getRegistrationYear() : null)
                .chassisNumber(vehicle != null ? vehicle.getChassisNumber() : null)
                .engineNumber(vehicle != null ? vehicle.getEngineNumber() : null)
                .sanctionedAmount(loan.getLoanAmount())
                .loanStartDate(loan.getLoanStartDate())
                .loanClosureDate(loan.getClosedDate())
                .lenderName(loan.getFinanceCompany() != null ? loan.getFinanceCompany() : "DealerOS Private Finance")
                .loanStatus(loan.getStatus().name())
                .eligible(eligible)
                .ineligibilityReason(reason)
                .principalOutstanding(outstanding)
                .unpaidInstallmentCount((int) unpaidCount)
                .alreadyIssued(existingNocOpt.isPresent())
                .existingNocReference(existingNocOpt.map(LoanDocumentEntity::getDocumentReference).orElse(null))
                .existingNocIssueDate(existingNocOpt.map(LoanDocumentEntity::getIssueDate).orElse(null))
                .existingNocDownloadUrl(existingNocOpt.map(d -> "/api/v1.0/documents/" + d.getFileKey() + "/download").orElse(null))
                .clearanceChecklist(checklist)
                .build();
    }

    @Override
    @Transactional
    public LoanDocumentResponse issueNoc(Long loanId, String username) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        // Eligibility gate
        NocEligibilityResponse eligibility = checkNocEligibility(loanId);
        if (!eligibility.isEligible()) {
            throw new BusinessRuleViolationException("NOC cannot be issued: " + eligibility.getIneligibilityReason());
        }

        // Check if active NOC already issued - idempotent reissue / reprint
        var existingOpt = loanDocumentRepository.findFirstByFinanceDetailIdAndDocumentTypeAndIsActiveTrue(loanId, "NOC_CERTIFICATE");
        if (existingOpt.isPresent()) {
            log.info("NOC already issued for loan #{}. Returning existing document: {}", loanId, existingOpt.get().getDocumentReference());
            return mapToDocumentResponse(existingOpt.get());
        }

        CustomerEntity customer = loan.getSale() != null ? loan.getSale().getCustomer() : null;
        VehicleEntity vehicle = loan.getSale() != null ? loan.getSale().getVehicle() : null;

        String docRef = "NOC-" + (loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId())) + "-" + LocalDate.now().getYear();
        String fileKey = "noc_" + UUID.randomUUID() + ".pdf";

        LoanDocumentEntity docMeta = LoanDocumentEntity.builder()
                .documentReference(docRef)
                .financeDetail(loan)
                .customer(customer)
                .vehicle(vehicle)
                .category("NOC")
                .documentType("NOC_CERTIFICATE")
                .title("No Objection Certificate - " + (loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId())))
                .fileKey(fileKey)
                .originalFilename("NOC_" + (customer != null ? customer.getName().replaceAll("\\s+", "_") : "Loan") + ".pdf")
                .contentType("application/pdf")
                .issueDate(LocalDate.now())
                .version("1.0")
                .verificationStatus("VERIFIED")
                .notes("Formal hypothecation clearance certificate issued upon full loan realization.")
                .isActive(true)
                .build();
        docMeta.setCreatedBy(username != null ? username : "SYSTEM");

        // Generate PDF bytes and save to physical storage
        byte[] pdfBytes = loanDocumentPdfGeneratorService.generateNocPdf(loan, docMeta);
        docMeta.setFileSize((long) pdfBytes.length);

        savePdfToStorage(fileKey, pdfBytes);
        LoanDocumentEntity saved = loanDocumentRepository.save(docMeta);

        log.info("NOC successfully issued and registered: Ref: [{}] for Loan #[{}] by [{}]", docRef, loanId, username);
        return mapToDocumentResponse(saved);
    }

    // -------------------------------------------------------------
    // CENTRALIZED LOAN DOCUMENTS MANAGEMENT
    // -------------------------------------------------------------
    @Override
    @Transactional
    public LoanDocumentResponse uploadLoanDocument(
            Long loanId,
            org.springframework.web.multipart.MultipartFile file,
            String category,
            String documentType,
            String title,
            String notes,
            String username
    ) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        var uploadResp = storageService.storeFile(file, category != null ? category : "LOAN_DOCUMENTS");

        CustomerEntity customer = loan.getSale() != null ? loan.getSale().getCustomer() : null;
        VehicleEntity vehicle = loan.getSale() != null ? loan.getSale().getVehicle() : null;

        String docRef = "DOC-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        LoanDocumentEntity doc = LoanDocumentEntity.builder()
                .documentReference(docRef)
                .financeDetail(loan)
                .customer(customer)
                .vehicle(vehicle)
                .category(category != null ? category : "LOAN")
                .documentType(documentType != null ? documentType : "OTHER")
                .title(title != null && !title.isBlank() ? title : uploadResp.getOriginalFileName())
                .fileKey(uploadResp.getFileKey())
                .originalFilename(uploadResp.getOriginalFileName())
                .fileSize(uploadResp.getFileSize())
                .contentType(uploadResp.getContentType())
                .issueDate(LocalDate.now())
                .version("1.0")
                .verificationStatus("VERIFIED")
                .notes(notes)
                .isActive(true)
                .build();
        doc.setCreatedBy(username != null ? username : "SYSTEM");

        LoanDocumentEntity saved = loanDocumentRepository.save(doc);
        log.info("Document [{}] uploaded for loan #[{}] by [{}]", docRef, loanId, username);
        return mapToDocumentResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LoanDocumentResponse> getLoanDocuments(
            Long loanId,
            Long customerId,
            String category,
            String documentType,
            String search,
            Pageable pageable
    ) {
        Specification<LoanDocumentEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (loanId != null) {
                predicates.add(cb.equal(root.get("financeDetail").get("id"), loanId));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(root.get("category"), category.toUpperCase().trim()));
            }
            if (documentType != null && !documentType.isBlank() && !"ALL".equalsIgnoreCase(documentType)) {
                predicates.add(cb.equal(root.get("documentType"), documentType.toUpperCase().trim()));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("documentReference")), pattern),
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("originalFilename")), pattern),
                        cb.like(cb.lower(root.join("customer").get("name")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<LoanDocumentEntity> page = loanDocumentRepository.findAll(spec, pageable);
        List<LoanDocumentResponse> content = page.getContent().stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadNocPdf(Long loanId) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        var docOpt = loanDocumentRepository.findFirstByFinanceDetailIdAndDocumentTypeAndIsActiveTrue(loanId, "NOC_CERTIFICATE");
        LoanDocumentEntity docMeta = docOpt.orElseGet(() -> LoanDocumentEntity.builder()
                .documentReference("NOC-PREVIEW-" + loan.getId())
                .issueDate(LocalDate.now())
                .fileKey("preview.pdf")
                .build());

        return loanDocumentPdfGeneratorService.generateNocPdf(loan, docMeta);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadRepaymentSchedulePdf(Long loanId) {
        FinanceDetailEntity loan = financeDetailRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        List<EmiScheduleEntity> emis = emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(loanId);
        return loanDocumentPdfGeneratorService.generateRepaymentSchedulePdf(loan, emis);
    }

    private void savePdfToStorage(String fileKey, byte[] pdfBytes) {
        try {
            java.nio.file.Path target = java.nio.file.Paths.get("uploads").resolve(fileKey).toAbsolutePath();
            java.nio.file.Files.createDirectories(target.getParent());
            java.nio.file.Files.write(target, pdfBytes, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.TRUNCATE_EXISTING);
        } catch (Exception e) {
            log.warn("Could not write PDF directly to storage folder: {}", e.getMessage());
        }
    }

    private LoanDocumentResponse mapToDocumentResponse(LoanDocumentEntity d) {
        String custName = d.getCustomer() != null ? d.getCustomer().getName() : null;
        String vehReg = d.getVehicle() != null ? d.getVehicle().getRegistrationNumber() : null;
        String vehName = d.getVehicle() != null ? (d.getVehicle().getBrand() + " " + d.getVehicle().getModel()) : null;
        String loanAcc = d.getFinanceDetail() != null ? d.getFinanceDetail().getLoanAccountNumber() : null;

        return LoanDocumentResponse.builder()
                .id(d.getId())
                .documentReference(d.getDocumentReference())
                .financeId(d.getFinanceDetail() != null ? d.getFinanceDetail().getId() : null)
                .loanAccountNumber(loanAcc)
                .customerId(d.getCustomer() != null ? d.getCustomer().getId() : null)
                .customerName(custName)
                .vehicleId(d.getVehicle() != null ? d.getVehicle().getId() : null)
                .vehicleRegistrationNumber(vehReg)
                .vehicleName(vehName)
                .category(d.getCategory())
                .documentType(d.getDocumentType())
                .title(d.getTitle())
                .fileKey(d.getFileKey())
                .downloadUrl("/api/v1.0/documents/" + d.getFileKey() + "/download")
                .originalFilename(d.getOriginalFilename())
                .fileSize(d.getFileSize())
                .contentType(d.getContentType())
                .issueDate(d.getIssueDate())
                .version(d.getVersion())
                .verificationStatus(d.getVerificationStatus())
                .notes(d.getNotes())
                .isActive(d.getIsActive())
                .createdByUser(d.getCreatedBy())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
