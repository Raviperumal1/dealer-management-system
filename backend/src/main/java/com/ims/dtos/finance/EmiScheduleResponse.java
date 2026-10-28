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
public class EmiScheduleResponse {

    private Long id;
    private Long financeId;
    private String financeCompany;
    private String loanAccountNumber;
    private String customerName;
    private String vehicleRegistrationNumber;
    private Integer installmentNumber;
    private LocalDate dueDate;
    private BigDecimal emiAmount;
    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private String status;
    private LocalDate paidDate;
    private BigDecimal principalRemaining;
    private String paymentReference;
    private String paymentMethod;
    private BigDecimal penaltyAmount;
}
