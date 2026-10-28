package com.ims.dtos.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceApplicationCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long saleId;

    @NotBlank(message = "Finance type is required (IN_HOUSE or EXTERNAL_BANK)")
    private String financeType; // IN_HOUSE, EXTERNAL_BANK

    private Long lenderId;
    private String lenderName;

    @NotBlank(message = "Applicant name is required")
    private String applicantName;

    @NotBlank(message = "Applicant mobile number is required")
    private String applicantPhone;

    private String applicantEmail;
    private String employmentType; // SALARIED, SELF_EMPLOYED, BUSINESS
    private BigDecimal declaredMonthlyIncome;

    @NotNull(message = "Vehicle price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal totalVehiclePrice;

    private BigDecimal downPayment;
    private BigDecimal tradeInCredit;

    @NotNull(message = "Requested loan amount is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal requestedLoanAmount;

    @NotNull(message = "Requested tenure in months is required")
    private Integer requestedTenureMonths;

    @NotNull(message = "Interest rate is required")
    private BigDecimal interestRate;

    private BigDecimal processingFee;
    private String notes;
}
