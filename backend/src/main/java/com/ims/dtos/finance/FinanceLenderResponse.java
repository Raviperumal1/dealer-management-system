package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceLenderResponse {
    private Long id;
    private String lenderCode;
    private String name;
    private String lenderType;
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private String supportedVehicleTypes;
    private Integer minTenureMonths;
    private Integer maxTenureMonths;
    private BigDecimal indicativeInterestRate;
    private BigDecimal processingFeePercentage;
    private BigDecimal dealerCommissionPercentage;
    private String commissionPayoutBasis;
    private String documentationChecklist;
    private String notes;
    private Boolean isActive;
    private Instant createdAt;
}
