package com.ims.dtos.inventory;

import com.ims.enums.PaymentMethod;
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
public class SupplierPaymentCreateRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private Long invoiceId; // Optional if advance payment

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String transactionReference;
    private Boolean isAdvance;
    private String branchWarehouse;
    private String notes;
}
