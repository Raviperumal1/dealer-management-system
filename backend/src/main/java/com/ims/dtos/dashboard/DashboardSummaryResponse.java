package com.ims.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private InventoryKpi inventory;
    private PurchaseKpi purchases;
    private SalesKpi sales;
    private FinancialKpi financial;
    private WorkshopKpi workshop;
    private ServiceKpi service;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryKpi {
        private long totalOwnVehicles;
        private long totalBrokerVehicles;
        private long availableCars;
        private long availableBikes;
        private long bookedVehicles;
        private long soldVehicles;
        private long deliveredVehicles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseKpi {
        private long todayPurchasesCount;
        private BigDecimal todayPurchasesAmount;
        private long monthlyPurchasesCount;
        private BigDecimal monthlyPurchasesAmount;
        private BigDecimal totalPurchasesAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesKpi {
        private long todaySalesCount;
        private BigDecimal todaySalesAmount;
        private long monthlySalesCount;
        private BigDecimal monthlySalesAmount;
        private long directSalesCount;
        private long financeSalesCount;
        private long carSalesCount;
        private long bikeSalesCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialKpi {
        private BigDecimal totalOwnVehicleCost;
        private BigDecimal totalOwnVehicleProfit;
        private BigDecimal totalBrokerGrossCommission;
        private BigDecimal totalBrokerNetCommission;
        private BigDecimal pendingBrokerSettlementAmount;
        private long pendingFinanceCount;
        private BigDecimal totalExpenses;
        private BigDecimal totalOutstandingBalances;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkshopKpi {
        private long pendingJobCardsCount;
        private long vehiclesUnderRepairCount;
        private long readyForSaleCount;
        private long partsUsedCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceKpi {
        private long todayServiceCount;
        private long upcomingServiceCount;
        private long dueServiceCount;
        private long overdueServiceCount;
    }
}
