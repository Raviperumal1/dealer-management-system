package com.ims.service.impl.finance;

import com.ims.dtos.finance.LenderCommissionRequest;
import com.ims.dtos.finance.LenderCommissionResponse;
import com.ims.dtos.finance.LenderReceiptRequest;
import com.ims.entity.finance.FinanceApplicationEntity;
import com.ims.entity.finance.FinanceLenderEntity;
import com.ims.entity.finance.LenderCommissionEntity;
import com.ims.entity.finance.LenderCommissionReceiptEntity;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.finance.FinanceApplicationRepository;
import com.ims.repository.finance.FinanceLenderRepository;
import com.ims.repository.finance.LenderCommissionReceiptRepository;
import com.ims.repository.finance.LenderCommissionRepository;
import com.ims.service.serviceInterface.finance.LenderCommissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LenderCommissionServiceImpl implements LenderCommissionService {

    private final LenderCommissionRepository commissionRepository;
    private final LenderCommissionReceiptRepository receiptRepository;
    private final FinanceLenderRepository lenderRepository;
    private final FinanceApplicationRepository applicationRepository;

    @Override
    public LenderCommissionResponse calculateCommissionPreview(LenderCommissionRequest req) {
        return computeCommissionDetails(req, null, null);
    }

    @Override
    @Transactional
    public LenderCommissionResponse createCommissionEntry(LenderCommissionRequest req, String username) {
        FinanceLenderEntity lender = lenderRepository.findById(req.getLenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Finance partner not found with id: " + req.getLenderId()));

        FinanceApplicationEntity app = null;
        if (req.getLoanApplicationId() != null) {
            app = applicationRepository.findById(req.getLoanApplicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Loan application not found: " + req.getLoanApplicationId()));

            // Prevent duplicate commission on same loan application
            if (commissionRepository.findByLoanApplicationId(req.getLoanApplicationId()).isPresent()) {
                throw new BusinessRuleViolationException("A commission entry already exists for loan application #" + app.getApplicationNumber());
            }

            // Sanctioned/Disbursed check
            if (!"DISBURSED".equalsIgnoreCase(app.getStatus()) && !"SANCTIONED".equalsIgnoreCase(app.getStatus())) {
                throw new BusinessRuleViolationException("Loan application must be SANCTIONED or DISBURSED to generate commission. Current status: " + app.getStatus());
            }

            // A commission based on actual disbursement strictly requires an actual completed disbursement
            if ("PERCENTAGE_OF_DISBURSEMENT".equalsIgnoreCase(req.getCalculationMethod())) {
                if (!"DISBURSED".equalsIgnoreCase(app.getStatus()) || app.getDisbursedAmount() == null || app.getDisbursedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessRuleViolationException("Disbursement-based commission requires an actual verified disbursement. Sanctioned but undisbursed loans are not eligible.");
                }
            }
        }

        LenderCommissionResponse preview = computeCommissionDetails(req, lender, app);

        String ref = "COMM-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        LenderCommissionEntity entity = LenderCommissionEntity.builder()
                .commissionReference(ref)
                .entryDate(req.getEntryDate() != null ? req.getEntryDate() : LocalDate.now())
                .lenderId(lender.getId())
                .lenderName(lender.getName())
                .agreementReference(req.getAgreementReference() != null ? req.getAgreementReference() : ("AGR-" + lender.getLenderCode()))
                .policyVersion(req.getPolicyVersion() != null ? req.getPolicyVersion() : "1.0")
                .loanApplicationId(app != null ? app.getId() : null)
                .loanApplicationNumber(app != null ? app.getApplicationNumber() : null)
                .saleId(app != null && app.getSaleId() != null ? app.getSaleId() : req.getSaleId())
                .saleNumber(app != null && app.getSaleId() != null ? ("SALE-" + app.getSaleId()) : null)
                .customerId(app != null && app.getCustomer() != null ? app.getCustomer().getId() : null)
                .customerName(app != null && app.getCustomer() != null ? app.getCustomer().getName() : (app != null ? app.getApplicantName() : null))
                .vehicleId(app != null && app.getVehicle() != null ? app.getVehicle().getId() : null)
                .vehicleRegNumber(app != null && app.getVehicle() != null ? app.getVehicle().getRegistrationNumber() : null)
                .vehicleDescription(app != null && app.getVehicle() != null ? (app.getVehicle().getBrand() + " " + app.getVehicle().getModel()) : null)
                .disbursementDate(app != null ? app.getDisbursementDate() : req.getEntryDate())
                .actualDisbursedAmount(preview.getActualDisbursedAmount())
                .processingFeeCollected(preview.getProcessingFeeCollected())
                .calculationMethod(preview.getCalculationMethod())
                .commissionBaseAmount(preview.getCommissionBaseAmount())
                .commissionRatePercentage(preview.getCommissionRatePercentage())
                .fixedCommissionRate(preview.getFixedCommissionRate())
                .grossCommission(preview.getGrossCommission())
                .taxPercentage(preview.getTaxPercentage())
                .taxAmount(preview.getTaxAmount())
                .tdsPercentage(preview.getTdsPercentage())
                .tdsWithheld(preview.getTdsWithheld())
                .approvedAdjustments(preview.getApprovedAdjustments())
                .netReceivable(preview.getNetReceivable())
                .amountInvoiced(BigDecimal.ZERO)
                .amountReceived(BigDecimal.ZERO)
                .outstandingBalance(preview.getNetReceivable())
                .status("ACCRUED")
                .entryMode(req.getEntryMode() != null ? req.getEntryMode() : (app != null ? "LOAN_LINKED" : "MANUAL"))
                .manualEntryReason(req.getManualEntryReason())
                .notes(req.getNotes())
                .build();

        LenderCommissionEntity saved = commissionRepository.save(entity);
        log.info("Lender commission [{}] booked for partner [{}] by [{}]", saved.getCommissionReference(), saved.getLenderName(), username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LenderCommissionResponse approveCommission(Long commissionId, String remarks, String username) {
        LenderCommissionEntity entity = getEntity(commissionId);
        if ("APPROVED".equalsIgnoreCase(entity.getStatus()) || "INVOICED".equalsIgnoreCase(entity.getStatus()) || "SETTLED".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessRuleViolationException("Commission is already in status: " + entity.getStatus());
        }

        entity.setStatus("APPROVED");
        entity.setApprovedBy(username);
        entity.setApprovalTimestamp(Instant.now());
        entity.setApprovalRemarks(remarks);

        return mapToResponse(commissionRepository.save(entity));
    }

    @Override
    @Transactional
    public LenderCommissionResponse rejectCommission(Long commissionId, String remarks, String username) {
        LenderCommissionEntity entity = getEntity(commissionId);
        entity.setStatus("REJECTED");
        entity.setApprovalRemarks(remarks);
        entity.setApprovedBy(username);
        return mapToResponse(commissionRepository.save(entity));
    }

    @Override
    @Transactional
    public LenderCommissionResponse generateInvoice(Long commissionId, String invoiceNumber, LocalDate invoiceDate, String username) {
        LenderCommissionEntity entity = getEntity(commissionId);
        if (!"APPROVED".equalsIgnoreCase(entity.getStatus()) && !"ACCRUED".equalsIgnoreCase(entity.getStatus())) {
            throw new BusinessRuleViolationException("Commission must be ACCRUED or APPROVED to raise invoice. Current status: " + entity.getStatus());
        }

        entity.setInvoiceNumber(invoiceNumber != null && !invoiceNumber.isBlank() ? invoiceNumber : ("INV-COMM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()));
        entity.setInvoiceDate(invoiceDate != null ? invoiceDate : LocalDate.now());
        entity.setAmountInvoiced(entity.getNetReceivable());
        entity.setStatus("INVOICED");

        log.info("Invoice [{}] generated for commission [{}]", entity.getInvoiceNumber(), entity.getCommissionReference());
        return mapToResponse(commissionRepository.save(entity));
    }

    @Override
    @Transactional
    public LenderCommissionResponse recordReceipt(Long commissionId, LenderReceiptRequest req, String username) {
        LenderCommissionEntity comm = getEntity(commissionId);
        if ("SETTLED".equalsIgnoreCase(comm.getStatus())) {
            throw new BusinessRuleViolationException("Commission is already fully settled.");
        }

        BigDecimal recAmount = req.getTotalReceivedAmount() != null ? req.getTotalReceivedAmount() : BigDecimal.ZERO;
        if (recAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Received amount must be greater than zero");
        }

        // Create settlement receipt record
        String rRef = "REC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LenderCommissionReceiptEntity receipt = LenderCommissionReceiptEntity.builder()
                .receiptReference(rRef)
                .lenderId(comm.getLenderId())
                .lenderName(comm.getLenderName())
                .receiptDate(req.getReceiptDate() != null ? req.getReceiptDate() : LocalDate.now())
                .totalReceivedAmount(recAmount)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "BANK_TRANSFER")
                .bankUtrReference(req.getBankUtrReference() != null ? req.getBankUtrReference() : "UTR-AUTO-" + System.currentTimeMillis())
                .bankName(req.getBankName())
                .allocatedAmount(recAmount)
                .unallocatedBalance(BigDecimal.ZERO)
                .tdsDeductedByBank(req.getTdsDeductedByBank() != null ? req.getTdsDeductedByBank() : BigDecimal.ZERO)
                .status("VERIFIED")
                .reconciliationNotes(req.getReconciliationNotes())
                .build();
        receiptRepository.save(receipt);

        // Update Commission Balance
        BigDecimal newAmountReceived = comm.getAmountReceived().add(recAmount);
        BigDecimal newOutstanding = comm.getNetReceivable().subtract(newAmountReceived);
        if (newOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            newOutstanding = BigDecimal.ZERO;
        }

        comm.setAmountReceived(newAmountReceived);
        comm.setOutstandingBalance(newOutstanding);
        comm.setPaymentReceiptReference(rRef);
        comm.setBankUtrReference(receipt.getBankUtrReference());
        comm.setSettlementReference(rRef);

        if (newOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            comm.setStatus("SETTLED");
        } else {
            comm.setStatus("PARTIALLY_SETTLED");
        }

        log.info("Partner receipt [{}] allocated to commission [{}]. New balance: ₹{}", rRef, comm.getCommissionReference(), newOutstanding);
        return mapToResponse(commissionRepository.save(comm));
    }

    @Override
    @Transactional
    public LenderCommissionResponse reverseCommission(Long commissionId, String reason, String username) {
        LenderCommissionEntity entity = getEntity(commissionId);
        entity.setStatus("REVERSED");
        entity.setNotes((entity.getNotes() != null ? entity.getNotes() + " | " : "") + "REVERSED: " + reason);
        entity.setOutstandingBalance(BigDecimal.ZERO);
        return mapToResponse(commissionRepository.save(entity));
    }

    @Override
    public Page<LenderCommissionResponse> getCommissions(Long lenderId, String status, String search, Pageable pageable) {
        Specification<LenderCommissionEntity> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (lenderId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("lenderId"), lenderId));
            }
            if (status != null && !status.isBlank()) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("commissionReference")), pattern),
                        cb.like(cb.lower(root.get("lenderName")), pattern),
                        cb.like(cb.lower(root.get("customerName")), pattern),
                        cb.like(cb.lower(root.get("vehicleRegNumber")), pattern),
                        cb.like(cb.lower(root.get("loanApplicationNumber")), pattern)
                ));
            }
            return predicates;
        };

        return commissionRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public LenderCommissionResponse getCommissionById(Long id) {
        return mapToResponse(getEntity(id));
    }

    @Override
    public Map<String, Object> getCommissionDashboardMetrics() {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal grossThisMonth = commissionRepository.sumGrossCommissionBetween(startOfMonth, endOfMonth);
        BigDecimal outstandingReceivable = commissionRepository.sumOutstandingReceivable();
        BigDecimal receivedThisMonth = commissionRepository.sumCommissionReceivedBetween(startOfMonth, endOfMonth);
        BigDecimal tdsThisMonth = commissionRepository.sumTdsWithheldBetween(startOfMonth, endOfMonth);

        long activePartners = lenderRepository.count();
        long totalCommissionsCount = commissionRepository.count();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("grossCommissionThisMonth", grossThisMonth != null ? grossThisMonth : BigDecimal.ZERO);
        metrics.put("outstandingCommissionReceivable", outstandingReceivable != null ? outstandingReceivable : BigDecimal.ZERO);
        metrics.put("commissionReceivedThisMonth", receivedThisMonth != null ? receivedThisMonth : BigDecimal.ZERO);
        metrics.put("tdsWithheldThisMonth", tdsThisMonth != null ? tdsThisMonth : BigDecimal.ZERO);
        metrics.put("activePartnersCount", activePartners);
        metrics.put("totalCommissionsBooked", totalCommissionsCount);

        return metrics;
    }

    private LenderCommissionEntity getEntity(Long id) {
        return commissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lender commission not found with id: " + id));
    }

    private LenderCommissionResponse computeCommissionDetails(LenderCommissionRequest req, FinanceLenderEntity lender, FinanceApplicationEntity app) {
        String method = req.getCalculationMethod() != null ? req.getCalculationMethod() : "PERCENTAGE_OF_PROCESSING_FEE";
        BigDecimal base = req.getBaseAmount() != null ? req.getBaseAmount() : BigDecimal.ZERO;
        BigDecimal rate = req.getCommissionRatePercentage() != null ? req.getCommissionRatePercentage() : BigDecimal.ZERO;
        BigDecimal fixed = req.getFixedCommissionRate() != null ? req.getFixedCommissionRate() : BigDecimal.ZERO;
        BigDecimal disbursed = BigDecimal.ZERO;
        BigDecimal procFee = BigDecimal.ZERO;

        if (app != null) {
            disbursed = app.getDisbursedAmount() != null && app.getDisbursedAmount().compareTo(BigDecimal.ZERO) > 0
                    ? app.getDisbursedAmount() : (app.getSanctionedAmount() != null ? app.getSanctionedAmount() : BigDecimal.ZERO);
            procFee = app.getProcessingFee() != null ? app.getProcessingFee() : BigDecimal.ZERO;

            if (base.compareTo(BigDecimal.ZERO) == 0) {
                if ("PERCENTAGE_OF_DISBURSEMENT".equalsIgnoreCase(method)) {
                    base = disbursed;
                } else if ("PERCENTAGE_OF_PROCESSING_FEE".equalsIgnoreCase(method)) {
                    base = procFee;
                }
            }
        }

        if (rate.compareTo(BigDecimal.ZERO) == 0 && lender != null) {
            rate = lender.getDealerCommissionPercentage() != null ? lender.getDealerCommissionPercentage() : BigDecimal.valueOf(80.00);
        }

        // Method Calculations
        BigDecimal grossCommission;
        if ("PERCENTAGE_OF_DISBURSEMENT".equalsIgnoreCase(method)) {
            grossCommission = base.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if ("PERCENTAGE_OF_PROCESSING_FEE".equalsIgnoreCase(method)) {
            grossCommission = base.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(method) || "FIXED_PER_LOAN".equalsIgnoreCase(method) || "FIXED".equalsIgnoreCase(method)) {
            grossCommission = fixed.compareTo(BigDecimal.ZERO) > 0 ? fixed : base;
        } else {
            grossCommission = base.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        // GST is MANDATORILY EXCLUDED from this lender commission booking workflow
        BigDecimal taxPct = BigDecimal.ZERO;
        BigDecimal taxAmt = BigDecimal.ZERO;

        // TDS / Withholding: Default to 0 unless an approved withholding rate is explicitly configured/provided
        BigDecimal tdsPct = req.getTdsPercentage() != null ? req.getTdsPercentage() : BigDecimal.ZERO;
        BigDecimal tdsAmt = tdsPct.compareTo(BigDecimal.ZERO) > 0
                ? grossCommission.multiply(tdsPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal adj = req.getApprovedAdjustments() != null ? req.getApprovedAdjustments() : BigDecimal.ZERO;

        // Net Receivable = Gross Commission - Approved Withholding - Approved Adjustments (GST EXCLUDED)
        BigDecimal netReceivable = grossCommission.subtract(tdsAmt).subtract(adj);
        if (netReceivable.compareTo(BigDecimal.ZERO) < 0) {
            netReceivable = BigDecimal.ZERO;
        }

        return LenderCommissionResponse.builder()
                .lenderId(lender != null ? lender.getId() : req.getLenderId())
                .lenderName(lender != null ? lender.getName() : null)
                .actualDisbursedAmount(disbursed)
                .processingFeeCollected(procFee)
                .calculationMethod(method)
                .commissionBaseAmount(base)
                .commissionRatePercentage(rate)
                .fixedCommissionRate(fixed)
                .grossCommission(grossCommission)
                .taxPercentage(taxPct)
                .taxAmount(taxAmt)
                .tdsPercentage(tdsPct)
                .tdsWithheld(tdsAmt)
                .approvedAdjustments(adj)
                .netReceivable(netReceivable)
                .outstandingBalance(netReceivable)
                .build();
    }

    private LenderCommissionResponse mapToResponse(LenderCommissionEntity e) {
        return LenderCommissionResponse.builder()
                .id(e.getId())
                .commissionReference(e.getCommissionReference())
                .entryDate(e.getEntryDate())
                .lenderId(e.getLenderId())
                .lenderName(e.getLenderName())
                .agreementReference(e.getAgreementReference())
                .policyVersion(e.getPolicyVersion())
                .loanApplicationId(e.getLoanApplicationId())
                .loanApplicationNumber(e.getLoanApplicationNumber())
                .financeDetailId(e.getFinanceDetailId())
                .loanAccountNumber(e.getLoanAccountNumber())
                .saleId(e.getSaleId())
                .saleNumber(e.getSaleNumber())
                .customerId(e.getCustomerId())
                .customerName(e.getCustomerName())
                .vehicleId(e.getVehicleId())
                .vehicleRegNumber(e.getVehicleRegNumber())
                .vehicleDescription(e.getVehicleDescription())
                .disbursementDate(e.getDisbursementDate())
                .actualDisbursedAmount(e.getActualDisbursedAmount())
                .processingFeeCollected(e.getProcessingFeeCollected())
                .calculationMethod(e.getCalculationMethod())
                .commissionBaseAmount(e.getCommissionBaseAmount())
                .commissionRatePercentage(e.getCommissionRatePercentage())
                .fixedCommissionRate(e.getFixedCommissionRate())
                .grossCommission(e.getGrossCommission())
                .taxPercentage(e.getTaxPercentage())
                .taxAmount(e.getTaxAmount())
                .tdsPercentage(e.getTdsPercentage())
                .tdsWithheld(e.getTdsWithheld())
                .approvedAdjustments(e.getApprovedAdjustments())
                .netReceivable(e.getNetReceivable())
                .amountInvoiced(e.getAmountInvoiced())
                .amountReceived(e.getAmountReceived())
                .outstandingBalance(e.getOutstandingBalance())
                .invoiceNumber(e.getInvoiceNumber())
                .invoiceDate(e.getInvoiceDate())
                .paymentReceiptReference(e.getPaymentReceiptReference())
                .bankUtrReference(e.getBankUtrReference())
                .settlementReference(e.getSettlementReference())
                .status(e.getStatus())
                .entryMode(e.getEntryMode())
                .manualEntryReason(e.getManualEntryReason())
                .approvedBy(e.getApprovedBy())
                .approvalTimestamp(e.getApprovalTimestamp())
                .approvalRemarks(e.getApprovalRemarks())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
