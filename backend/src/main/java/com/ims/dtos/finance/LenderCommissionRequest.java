package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LenderCommissionRequest {
    private Long lenderId;
    private Long loanApplicationId;
    private Long saleId;
    private LocalDate entryDate;
    private String calculationMethod; // PERCENTAGE_OF_DISBURSEMENT, PERCENTAGE_OF_PROCESSING_FEE, FIXED_AMOUNT, TIERED_VOLUME
    private BigDecimal baseAmount;
    private BigDecimal commissionRatePercentage;
    private BigDecimal fixedCommissionRate;
    private BigDecimal taxPercentage;
    private BigDecimal tdsPercentage;
    private BigDecimal approvedAdjustments;
    private String agreementReference;
    private String policyVersion;
    private String entryMode; // LOAN_LINKED, MANUAL
    private String manualEntryReason;
    private String notes;
}
