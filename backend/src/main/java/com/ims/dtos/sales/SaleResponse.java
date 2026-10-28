package com.ims.dtos.sales;

import com.ims.enums.OwnershipType;
import com.ims.enums.SaleStatus;
import com.ims.enums.SaleType;
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
public class SaleResponse {

    private Long id;
    private String saleNumber;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private OwnershipType ownershipType;
    private LocalDate saleDate;
    private SaleType saleType;
    private BigDecimal agreedPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalSalePrice;
    private BigDecimal totalPaid;
    private BigDecimal balanceDue;
    private SaleStatus status;
    private String notes;
    private List<PaymentResponse> payments;
    private FinanceSummaryDto finance;
    private DeliverySummaryDto delivery;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinanceSummaryDto {
        private Long id;
        private String financeCompany;
        private String loanAccountNumber;
        private BigDecimal loanAmount;
        private BigDecimal downPayment;
        private BigDecimal interestRate;
        private Integer tenureMonths;
        private BigDecimal emiAmount;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliverySummaryDto {
        private Long id;
        private LocalDate deliveryDate;
        private String recipientName;
        private Integer odometerAtDelivery;
        private String deliveryStatus;
    }
}
