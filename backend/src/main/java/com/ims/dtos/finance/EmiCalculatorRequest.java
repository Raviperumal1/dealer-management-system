package com.ims.dtos.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class EmiCalculatorRequest {

    @NotNull(message = "Vehicle sale amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Vehicle price must be greater than zero")
    private BigDecimal vehicleAmount;

    @Builder.Default
    private BigDecimal downPayment = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal tradeInCredit = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal financedFees = BigDecimal.ZERO;

    @NotNull(message = "Annual nominal interest rate is required")
    @DecimalMin(value = "0.0", message = "Interest rate cannot be negative")
    private BigDecimal annualInterestRate;

    @NotNull(message = "Tenure in months is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    private Integer tenureMonths;

    private LocalDate startDate;
}
