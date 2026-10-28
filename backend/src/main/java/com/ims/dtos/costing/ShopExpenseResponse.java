package com.ims.dtos.costing;

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
public class ShopExpenseResponse {

    private Long id;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private Long brokerId;
    private String brokerName;
    private String paymentMethod;
    private String referenceNo;
    private Instant createdAt;
}
