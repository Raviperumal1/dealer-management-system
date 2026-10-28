package com.ims.dtos.inventory;

import com.ims.enums.PaymentMethod;
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
public class SupplierPaymentResponse {

    private Long id;
    private String paymentCode;
    private Long supplierId;
    private String supplierName;
    private Long invoiceId;
    private String invoiceNumber;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String transactionReference;
    private boolean isAdvance;
    private BigDecimal unallocatedAmount;
    private String branchWarehouse;
    private String notes;
    private String createdByUser;
    private Instant createdAt;
}
