package com.ims.dtos.reports;

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
public class BrokerReportRow {
    private Long brokerId;
    private String brokerName;
    private String brokerMobile;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private LocalDate saleDate;
    private BigDecimal saleAmount;
    private BigDecimal brokerSettlementBasis;
    private BigDecimal grossCommission;
    private BigDecimal shopRepairDeduction;
    private BigDecimal netCommission;
    private BigDecimal netPayableToBroker;
    private BigDecimal paidToBroker;
    private BigDecimal balanceToBroker;
    private String settlementStatus;
}
