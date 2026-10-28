package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanForeclosureQuoteResponse {
    private Long loanId;
    private String loanAccountNumber;
    private String customerName;
    private String customerPhone;
    private String vehicleRegistrationNumber;
    private String quotationId;
    private LocalDate quotationDate;
    private LocalDate quoteValidUntil;

    // Authoritative breakdown
    private BigDecimal principalOutstanding;
    private BigDecimal accruedInterest;
    private BigDecimal overdueScheduledPrincipal;
    private BigDecimal overdueRegularInterest;
    private BigDecimal eligiblePenalCharges;
    private BigDecimal otherFees;

    // Prepayment / Foreclosure Fee
    private BigDecimal foreclosureChargePercentage;
    private BigDecimal foreclosureChargeAmount;
    private Boolean isRbiForeclosureExempt;

    // Credits & Adjustments
    private BigDecimal unallocatedCredits;
    private BigDecimal authorizedWaiverAmount;

    // Authoritative Total Settlement Payable (also alias netSettlementAmount for client compatibility)
    private BigDecimal totalSettlementPayable;
    private BigDecimal netSettlementAmount;

    private String appliedPolicyCode;
    private String termsAndConditions;
    private List<String> auditTrailNotes;
}
