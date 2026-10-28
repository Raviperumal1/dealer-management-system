package com.ims.entity.finance;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "loan_penalty_policies")
public class LoanPenaltyPolicyEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_code", nullable = false, unique = true, length = 50)
    private String policyCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "policy_version", nullable = false, length = 20)
    @Builder.Default
    private String policyVersion = "1.0";

    @Column(name = "borrower_category", nullable = false, length = 50)
    @Builder.Default
    private String borrowerCategory = "INDIVIDUAL"; // INDIVIDUAL, COMMERCIAL

    @Column(name = "interest_rate_type", nullable = false, length = 30)
    @Builder.Default
    private String interestRateType = "FIXED"; // FIXED, FLOATING

    @Column(name = "grace_period_days", nullable = false)
    @Builder.Default
    private Integer gracePeriodDays = 3;

    @Column(name = "charge_type", nullable = false, length = 30)
    @Builder.Default
    private String chargeType = "PERCENTAGE_OVERDUE";

    @Column(name = "annual_rate_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal annualRatePercentage = BigDecimal.valueOf(24.00);

    @Column(name = "fixed_charge_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal fixedChargeAmount = BigDecimal.ZERO;

    @Column(name = "per_event_cap", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal perEventCap = BigDecimal.valueOf(5000.00);

    @Column(name = "min_charge", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal minCharge = BigDecimal.valueOf(100.00);

    @Column(name = "foreclosure_charge_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal foreclosureChargeRate = BigDecimal.valueOf(2.00);

    @Column(name = "preclosure_enabled", nullable = false)
    @Builder.Default
    private Boolean preclosureEnabled = true;

    @Column(name = "eligibility_period_months", nullable = false)
    @Builder.Default
    private Integer eligibilityPeriodMonths = 3;

    @Column(name = "eligibility_start_basis", nullable = false, length = 50)
    @Builder.Default
    private String eligibilityStartBasis = "COMMENCEMENT_DATE";

    @Column(name = "inclusive_end_date_rule", nullable = false)
    @Builder.Default
    private Boolean inclusiveEndDateRule = true;

    @Column(name = "fee_calculation_base", nullable = false, length = 50)
    @Builder.Default
    private String feeCalculationBase = "OUTSTANDING_PRINCIPAL";

    @Column(name = "min_foreclosure_fee", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal minForeclosureFee = BigDecimal.ZERO;

    @Column(name = "max_foreclosure_fee", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal maxForeclosureFee = BigDecimal.valueOf(25000.00);

    @Column(name = "overdue_payable_at_settlement", nullable = false)
    @Builder.Default
    private Boolean overduePayableAtSettlement = true;

    @Column(name = "interest_calculation_method", nullable = false, length = 50)
    @Builder.Default
    private String interestCalculationMethod = "REDUCING_BALANCE_DAILY_ACCRUAL";

    @Column(name = "rbi_floating_rate_foreclosure_exempt", nullable = false)
    @Builder.Default
    private Boolean rbiFloatingRateForeclosureExempt = true;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "disclosure_text", columnDefinition = "TEXT")
    private String disclosureText;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
