package com.ims.dtos.finance;

import jakarta.validation.constraints.DecimalMin;
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
public class ApplicationDisbursementRequest {
    @NotNull(message = "Disbursed amount is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal disbursedAmount;

    private LocalDate disbursementDate;
    private String disbursementReference;
    private String notes;
}
