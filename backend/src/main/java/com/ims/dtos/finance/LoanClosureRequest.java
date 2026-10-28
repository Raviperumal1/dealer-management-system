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
public class LoanClosureRequest {

    private BigDecimal settlementAmountPaid;

    // Optional client alias
    private BigDecimal settlementPaymentAmount;

    private String paymentMethod; // BANK_TRANSFER, UPI, CASH, CHEQUE

    @NotNull(message = "Settlement payment reference is required")
    private String paymentReference;

    // Optional client alias
    private String settlementPaymentReference;

    private LocalDate closureDate;
    private String closureRemarks;

    // Optional waiver amount approved by manager
    private BigDecimal authorizedWaiver;
    private String waiverApprovalUser;
    private String idempotencyKey;

    public BigDecimal getEffectiveSettlementAmount() {
        if (settlementAmountPaid != null) return settlementAmountPaid;
        if (settlementPaymentAmount != null) return settlementPaymentAmount;
        return null;
    }

    public String getEffectivePaymentReference() {
        if (paymentReference != null && !paymentReference.isBlank()) return paymentReference;
        if (settlementPaymentReference != null && !settlementPaymentReference.isBlank()) return settlementPaymentReference;
        return null;
    }
}
