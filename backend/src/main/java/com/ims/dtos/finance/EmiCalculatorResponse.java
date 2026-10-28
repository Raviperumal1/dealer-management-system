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
public class EmiCalculatorResponse {

    private BigDecimal amountFinanced;
    private BigDecimal monthlyEmi;
    private Integer tenureMonths;
    private BigDecimal totalScheduledRepayment;
    private BigDecimal totalScheduledInterest;
    private BigDecimal applicableFees;
    private BigDecimal totalBorrowingCost;
    private LocalDate firstDueDate;
    private LocalDate lastDueDate;
    private String calculationMethod; // REDUCING_BALANCE_COMPOUND
    private List<AmortizationRowDto> schedule;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmortizationRowDto {
        private Integer installmentNumber;
        private LocalDate dueDate;
        private BigDecimal openingPrincipal;
        private BigDecimal scheduledEmi;
        private BigDecimal principalComponent;
        private BigDecimal interestComponent;
        private BigDecimal closingPrincipal;
    }
}
