package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceApplicationResponse {

    private Long id;
    private String applicationNumber;
    private Long customerId;
    private String customerName;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleName;
    private Long saleId;
    private String financeType;
    private Long lenderId;
    private String lenderName;
    private String applicantName;
    private String applicantPhone;
    private String applicantEmail;
    private String employmentType;
    private BigDecimal declaredMonthlyIncome;
    private BigDecimal totalVehiclePrice;
    private BigDecimal downPayment;
    private BigDecimal tradeInCredit;
    private BigDecimal requestedLoanAmount;
    private Integer requestedTenureMonths;
    private BigDecimal interestRate;
    private BigDecimal estimatedEmi;
    private BigDecimal processingFee;
    private String status;
    private BigDecimal sanctionedAmount;
    private String sanctionLetterReference;
    private LocalDate sanctionDate;
    private LocalDate sanctionValidUntil;
    private BigDecimal disbursedAmount;
    private LocalDate disbursementDate;
    private String disbursementReference;
    private String rejectionReason;
    private String notes;
    private String createdByUser;
    private Instant createdAt;
}
