package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "lender_commissions")
public class LenderCommissionEntity extends BaseEntity {

    @Column(name = "commission_reference", nullable = false, unique = true, length = 64)
    private String commissionReference;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "lender_id", nullable = false)
    private Long lenderId;

    @Column(name = "lender_name", nullable = false, length = 150)
    private String lenderName;

    @Column(name = "agreement_reference", length = 100)
    private String agreementReference;

    @Column(name = "policy_version", length = 20)
    @Builder.Default
    private String policyVersion = "1.0";

    // Linked Source Records
    @Column(name = "loan_application_id")
    private Long loanApplicationId;

    @Column(name = "loan_application_number", length = 50)
    private String loanApplicationNumber;

    @Column(name = "finance_detail_id")
    private Long financeDetailId;

    @Column(name = "loan_account_number", length = 64)
    private String loanAccountNumber;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "sale_number", length = 50)
    private String saleNumber;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "vehicle_reg_number", length = 50)
    private String vehicleRegNumber;

    @Column(name = "vehicle_description", length = 150)
    private String vehicleDescription;

    // Transaction & Base Amounts
    @Column(name = "disbursement_date")
    private LocalDate disbursementDate;

    @Column(name = "actual_disbursed_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal actualDisbursedAmount = BigDecimal.ZERO;

    @Column(name = "processing_fee_collected", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal processingFeeCollected = BigDecimal.ZERO;

    // Calculation Methodology
    @Column(name = "calculation_method", nullable = false, length = 50)
    private String calculationMethod; // PERCENTAGE_OF_DISBURSEMENT, PERCENTAGE_OF_PROCESSING_FEE, FIXED_AMOUNT, TIERED_VOLUME

    @Column(name = "commission_base_amount", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal commissionBaseAmount = BigDecimal.ZERO;

    @Column(name = "commission_rate_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionRatePercentage = BigDecimal.ZERO;

    @Column(name = "fixed_commission_rate", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal fixedCommissionRate = BigDecimal.ZERO;

    // Computed Financial Components
    @Column(name = "gross_commission", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal grossCommission = BigDecimal.ZERO;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.valueOf(18.00);

    @Column(name = "tax_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "tds_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tdsPercentage = BigDecimal.valueOf(5.00);

    @Column(name = "tds_withheld", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal tdsWithheld = BigDecimal.ZERO;

    @Column(name = "approved_adjustments", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal approvedAdjustments = BigDecimal.ZERO;

    @Column(name = "net_receivable", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal netReceivable = BigDecimal.ZERO;

    // Invoicing & Realization Tracking
    @Column(name = "amount_invoiced", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amountInvoiced = BigDecimal.ZERO;

    @Column(name = "amount_received", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amountReceived = BigDecimal.ZERO;

    @Column(name = "outstanding_balance", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "payment_receipt_reference", length = 100)
    private String paymentReceiptReference;

    @Column(name = "bank_utr_reference", length = 100)
    private String bankUtrReference;

    @Column(name = "settlement_reference", length = 100)
    private String settlementReference;

    // Commission Lifecycle Status
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "ACCRUED"; // PENDING_ELIGIBILITY, ACCRUED, APPROVAL_PENDING, APPROVED, INVOICED, PARTIALLY_SETTLED, SETTLED, REJECTED, REVERSED

    @Column(name = "entry_mode", nullable = false, length = 20)
    @Builder.Default
    private String entryMode = "LOAN_LINKED"; // LOAN_LINKED, MANUAL

    @Column(name = "manual_entry_reason", columnDefinition = "TEXT")
    private String manualEntryReason;

    // Approvals & Audit
    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approval_timestamp")
    private Instant approvalTimestamp;

    @Column(name = "approval_remarks", columnDefinition = "TEXT")
    private String approvalRemarks;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
