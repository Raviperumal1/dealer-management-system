package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanLedgerEntryResponse {
    private Long id;
    private String transactionId;
    private Long financeId;
    private Long customerId;
    private Long saleId;
    private String transactionType;
    private String entryDirection;
    private BigDecimal amount;
    private BigDecimal principalPortion;
    private BigDecimal interestPortion;
    private BigDecimal feePortion;
    private BigDecimal penaltyPortion;
    private BigDecimal principalBalanceAfter;
    private LocalDate effectiveDate;
    private LocalDateTime postingTimestamp;
    private String sourceReference;
    private String paymentMethod;
    private String paymentReference;
    private String status;
    private String createdByUser;
    private String notes;
}
