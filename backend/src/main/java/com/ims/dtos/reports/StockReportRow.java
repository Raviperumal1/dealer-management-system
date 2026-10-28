package com.ims.dtos.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReportRow {
    private Long partId;
    private String partNumber;
    private String name;
    private String category;
    private String unit;
    private Integer currentStock;
    private Integer minStockThreshold;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal inventoryValue;
    private boolean isLowStock;
}
