package com.ims.dtos.inventory;

import com.ims.enums.PaymentStatus;
import com.ims.enums.PurchaseBillStatus;
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
public class PurchaseInvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private String supplierInvoiceNumber;
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    private LocalDate invoiceDate;
    private LocalDate purchaseDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate dueDate;
    private String branchWarehouse;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private Long jobCardId;
    private String jobCardNumber;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal freightCharge;
    private BigDecimal otherCharges;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountOutstanding;
    private PurchaseBillStatus status;
    private PaymentStatus paymentStatus;
    private String documentPath;
    private String notes;
    private Instant postedAt;
    private String createdByUser;
    private Instant createdAt;
    private List<InvoiceItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItemDto {
        private Long id;
        private Long partId;
        private String partSku;
        private String partName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineDiscount;
        private BigDecimal taxPercentage;
        private BigDecimal taxAmount;
        private BigDecimal landedCostAllocation;
        private BigDecimal totalAmount;
    }
}
