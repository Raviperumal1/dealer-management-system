package com.ims.service.serviceInterface.costing;

import com.ims.common.PageResponse;
import com.ims.dtos.costing.*;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface VehicleCostingService {
    VehicleCostResponse getVehicleCost(Long vehicleId);
    VehicleProfitabilityResponse getVehicleProfitability(Long vehicleId);
    ShopExpenseResponse addShopExpense(ShopExpenseCreateRequest request);
    PageResponse<ShopExpenseResponse> getShopExpenses(Long vehicleId, Long brokerId, Pageable pageable);

    // Market rate analysis and suggested pricing methods
    MarketComparableResponse addMarketComparable(MarketComparableCreateRequest request, String username);
    List<MarketComparableResponse> getMarketComparables(Long vehicleId);
    MarketPricingAnalysisResponse getMarketPricingAnalysis(Long vehicleId, BigDecimal markupPercentage, BigDecimal targetGrossMarginPercentage);
}
