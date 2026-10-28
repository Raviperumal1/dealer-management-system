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
public class EmiPaymentRequest {

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private BigDecimal amount;

    private LocalDate paymentDate;

    private String paymentMethod; // CASH, BANK_TRANSFER, UPI, CHEQUE, CARD

    private String paymentReference; // UTR, Cheque No, Transaction ID

    private String notes;

    private String idempotencyKey;
}
