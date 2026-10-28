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
public class LenderReceiptRequest {
    private Long lenderId;
    private LocalDate receiptDate;
    private BigDecimal totalReceivedAmount;
    private String paymentMethod; // BANK_TRANSFER, CHEQUE, NEFT_RTGS
    private String bankUtrReference;
    private String bankName;
    private BigDecimal tdsDeductedByBank;
    private String reconciliationNotes;
}
