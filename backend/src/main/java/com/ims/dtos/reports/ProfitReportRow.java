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
public class ProfitReportRow {
    private Long vehicleId;
    private String registrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private String ownershipType;
    private LocalDate saleDate;
    private BigDecimal sellingPrice;
    private BigDecimal totalCostOrSettlementBasis;
    private BigDecimal shopRepairsAndExpenses;
    private BigDecimal recognizedGrossProfitOrNetCommission;
}
