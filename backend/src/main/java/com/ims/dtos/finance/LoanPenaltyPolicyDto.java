package com.ims.dtos.finance;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanPenaltyPolicyDto {

    private Long id;

    @NotBlank(message = "Policy code is required")
    private String policyCode;

    @NotBlank(message = "Policy name is required")
    private String name;

    private String policyVersion;

    private String borrowerCategory; // INDIVIDUAL, COMMERCIAL

    private String interestRateType; // FIXED, FLOATING

    private Integer gracePeriodDays;

    private String chargeType;

    private BigDecimal annualRatePercentage;

    private BigDecimal fixedChargeAmount;

    private BigDecimal perEventCap;

    private BigDecimal minCharge;

    @NotNull(message = "Foreclosure charge rate is required")
    @DecimalMin(value = "0.00", message = "Foreclosure rate cannot be negative")
    @DecimalMax(value = "10.00", message = "Foreclosure rate cannot exceed 10%")
    private BigDecimal foreclosureChargeRate;

    private Boolean preclosureEnabled;

    private Integer eligibilityPeriodMonths;

    private String eligibilityStartBasis; // COMMENCEMENT_DATE, FIRST_DISBURSEMENT_DATE

    private Boolean inclusiveEndDateRule;

    private String feeCalculationBase; // OUTSTANDING_PRINCIPAL, SANCTIONED_AMOUNT

    private BigDecimal minForeclosureFee;

    private BigDecimal maxForeclosureFee;

    private Boolean overduePayableAtSettlement;

    private String interestCalculationMethod;

    private Boolean rbiFloatingRateForeclosureExempt;

    private Boolean isActive;

    private String disclosureText;
}
