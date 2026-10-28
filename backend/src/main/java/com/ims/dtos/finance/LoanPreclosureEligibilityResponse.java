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
public class LoanPreclosureEligibilityResponse {
    private Long loanId;
    private String loanStatus;
    private Boolean preclosureEnabled;
    private Boolean eligible;
    private LocalDate commencementDate;
    private Integer eligibilityPeriodMonths;
    private LocalDate eligibilityEndDate;
    private LocalDate evaluatedBusinessDate;
    private String ineligibilityReason;
    private BigDecimal applicableFeeRate;
    private String applicableFeeBasis;
    private String policyVersion;
    private BigDecimal outstandingPrincipal;
    private BigDecimal estimatedSettlementPayable;
}
