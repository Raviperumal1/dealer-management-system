package com.ims.dtos.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDashboardMetricsResponse {

    private long totalVehiclesInStock;
    private long totalSparePartsItems;
    private long lowStockItemsCount;
    private BigDecimal sparePartsValuation;
    private BigDecimal vehicleInventoryValuation;
    private BigDecimal totalSupplierOutstanding;
    private BigDecimal overdueSupplierBills;
    private BigDecimal supplierCreditUtilizationRate;
    private BigDecimal partsPurchasesThisMonth;
    private BigDecimal vehicleRefurbishmentCosts;
    private BigDecimal estimatedVehicleGrossProfit;
    private BigDecimal soldVehicleGrossProfit;
}
