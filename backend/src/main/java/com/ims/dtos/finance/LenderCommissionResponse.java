package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LenderCommissionResponse {
    private Long id;
    private String commissionReference;
    private LocalDate entryDate;
    private Long lenderId;
    private String lenderName;
    private String agreementReference;
    private String policyVersion;

    private Long loanApplicationId;
    private String loanApplicationNumber;
    private Long financeDetailId;
    private String loanAccountNumber;
    private Long saleId;
    private String saleNumber;
    private Long customerId;
    private String customerName;
    private Long vehicleId;
    private String vehicleRegNumber;
    private String vehicleDescription;

    private LocalDate disbursementDate;
    private BigDecimal actualDisbursedAmount;
    private BigDecimal processingFeeCollected;

    private String calculationMethod;
    private BigDecimal commissionBaseAmount;
    private BigDecimal commissionRatePercentage;
    private BigDecimal fixedCommissionRate;

    private BigDecimal grossCommission;
    private BigDecimal taxPercentage;
    private BigDecimal taxAmount;
    private BigDecimal tdsPercentage;
    private BigDecimal tdsWithheld;
    private BigDecimal approvedAdjustments;
    private BigDecimal netReceivable;

    private BigDecimal amountInvoiced;
    private BigDecimal amountReceived;
    private BigDecimal outstandingBalance;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String paymentReceiptReference;
    private String bankUtrReference;
    private String settlementReference;

    private String status;
    private String entryMode;
    private String manualEntryReason;

    private String approvedBy;
    private Instant approvalTimestamp;
    private String approvalRemarks;
    private String notes;
    private Instant createdAt;
}
