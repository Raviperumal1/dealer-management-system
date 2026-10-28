package com.ims.dtos.costing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketPricingAnalysisResponse {

    private Long vehicleId;
    private String make;
    private String model;
    private String variant;
    private Integer manufacturingYear;
    private Integer odometerReading;
    private BigDecimal totalVehicleCost;

    // Pricing formulas
    private BigDecimal markupPercentage;
    private BigDecimal suggestedPriceMarkup;
    private BigDecimal expectedProfitMarkup;
    private BigDecimal grossMarginPercentageMarkup;

    private BigDecimal targetGrossMarginPercentage;
    private BigDecimal suggestedPriceGrossMargin;
    private BigDecimal expectedProfitGrossMargin;
    private BigDecimal grossMarginPercentageTarget;

    // Market comparables
    private int comparableListingsCount;
    private BigDecimal lowestObservedAskingPrice;
    private BigDecimal medianAskingPrice;
    private BigDecimal highestObservedAskingPrice;
    private LocalDate lastObservationDate;
    private String competitivePriceRange;

    // Warnings and decision
    private boolean pricingWarning;
    private String warningMessage;
    private BigDecimal proposedSellingPrice;

    private List<MarketComparableResponse> comparables;
}
