package com.ims.dtos.broker;

import com.ims.enums.PaymentMethod;
import com.ims.enums.SettlementStatus;
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
public class SettlementResponse {

    private Long id;
    private Long brokerId;
    private String brokerName;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private Long saleId;
    private BigDecimal saleAmount;
    private BigDecimal brokerAmount;
    private BigDecimal grossCommission;
    private BigDecimal otherDeductions;
    private BigDecimal netPayable;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private SettlementStatus settlementStatus;
    private List<PaymentItemDto> payments;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentItemDto {
        private Long id;
        private LocalDate paymentDate;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private String paymentReference;
        private String notes;
        private Instant createdAt;
    }
}
