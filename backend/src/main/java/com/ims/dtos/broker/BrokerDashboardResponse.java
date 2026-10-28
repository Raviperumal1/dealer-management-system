package com.ims.dtos.broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerDashboardResponse {

    private Long brokerId;
    private String brokerName;
    private long totalListedVehicles;
    private long availableVehicles;
    private long soldVehicles;
    private BigDecimal totalTransactionValue;
    private BigDecimal grossCommission;
    private BigDecimal shopBorneExpenses;
    private BigDecimal netCommission;
    private long pendingSettlementsCount;
    private long partiallyPaidSettlementsCount;
    private long paidSettlementsCount;
    private BigDecimal totalPaidToBroker;
    private BigDecimal totalBalancePayable;
}
