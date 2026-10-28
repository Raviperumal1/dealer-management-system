package com.ims.dtos.costing;

import com.ims.enums.OwnershipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleProfitabilityResponse {

    private Long vehicleId;
    private String registrationNumber;
    private OwnershipType ownershipType;
    private BigDecimal salePrice;

    // For OWN vehicle
    private BigDecimal totalVehicleCost;
    private BigDecimal ownVehicleGrossProfit;

    // For BROKER vehicle
    private BigDecimal brokerSettlementBasis;
    private BigDecimal brokerGrossCommission;
    private BigDecimal shopBorneExpenses;
    private BigDecimal brokerNetCommission;

    // Normalized Dealership Profit / Income Recognized
    private BigDecimal recognizedDealershipIncome;
    private String accountingNote;
}
