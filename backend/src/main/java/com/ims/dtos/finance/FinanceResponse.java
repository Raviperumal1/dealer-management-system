package com.ims.dtos.finance;

import com.ims.enums.FinanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceResponse {

    private Long id;
    private Long saleId;
    private String saleNumber;
    private Long customerId;
    private String customerName;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String financeCompany;
    private String loanAccountNumber;
    private BigDecimal loanAmount;
    private BigDecimal downPayment;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal emiAmount;
    private Integer emiDueDay;
    private LocalDate loanStartDate;
    private LocalDate loanEndDate;
    private FinanceStatus status;
    private String notes;
    private String financeType;
    private Long lenderId;
    private Long financeApplicationId;
    private BigDecimal processingFee;
    private BigDecimal principalOutstanding;
    private BigDecimal totalInterestAccrued;
    private BigDecimal totalInterestPaid;
    private BigDecimal totalPrincipalPaid;
    private BigDecimal foreclosureCharge;
    private LocalDate closedDate;
    private String closureRemarks;
    private List<EmiScheduleResponse> emiSchedule;
    private Instant createdAt;
}
