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
public class ApplicationSanctionRequest {
    private BigDecimal sanctionedAmount;
    private String sanctionLetterReference;
    private LocalDate sanctionDate;
    private LocalDate sanctionValidUntil;
    private String notes;
}
