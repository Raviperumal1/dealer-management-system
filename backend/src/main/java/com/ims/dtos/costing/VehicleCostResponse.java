package com.ims.dtos.costing;

import com.ims.enums.OwnershipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCostResponse {

    private Long vehicleId;
    private String registrationNumber;
    private OwnershipType ownershipType;

    // 1. Procurement & Acquisition Breakdown
    private BigDecimal purchasePrice;
    private BigDecimal purchaseExpenses;
    private BigDecimal purchaseCredits;
    private BigDecimal landedAcquisitionCost;

    // 2. Finalized Dealer-Borne Capitalized Refurbishment (From COMPLETED / CLOSED Job Cards)
    private BigDecimal shopRepairCost;
    private BigDecimal accessoriesCost;
    private BigDecimal labourCost;
    private BigDecimal otherExpenses;
    private BigDecimal finalizedDealerCost; // Landed + Capitalized Repairs + Approved Other Expenses - Credits

    // 3. Provisional / Estimated Exposure (From OPEN / IN_PROGRESS Job Cards)
    private BigDecimal estimatedRepairExposure;
    private BigDecimal customerBorneRepairAmount;
    private BigDecimal brokerBorneRepairAmount;

    // 4. Backward Compatibility Alias (Matches finalizedDealerCost)
    private BigDecimal totalVehicleCost;

    // 5. Authoritative Pricing Recommendations
    private BigDecimal targetMarkupPercentage;
    private BigDecimal recommendedSellingPriceMarkup;
    private BigDecimal targetGrossMarginPercentage;
    private BigDecimal recommendedSellingPriceGrossMargin;
    private BigDecimal advertisedSellingPrice;
    private BigDecimal approvedNegotiatedPrice;

    // 6. For BROKER vehicle
    private BigDecimal brokerAskingPrice;
    private BigDecimal shopRepairCostBrokerShopBorne;
    private BigDecimal otherShopExpenses;

    // 7. Component breakdown itemization for audit transparency
    private List<JobCardCostItemDto> jobCardBreakdown;

    private Instant calculatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardCostItemDto {
        private Long jobCardId;
        private String jobCardNumber;
        private String status;
        private String costResponsibility;
        private BigDecimal totalCost;
        private BigDecimal shopCost;
        private BigDecimal brokerCost;
        private BigDecimal customerCost;
        private boolean finalized; // true if COMPLETED / CLOSED
        private String remarks;
    }
}
