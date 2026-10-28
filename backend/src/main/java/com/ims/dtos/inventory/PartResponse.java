package com.ims.dtos.inventory;

import com.ims.enums.CompatibleVehicleType;
import com.ims.enums.PartCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartResponse {

    private Long id;
    private String sku;
    private String name;
    private PartCategory category;
    private String manufacturerBrand;
    private String partNumber;
    private CompatibleVehicleType compatibleVehicleType;
    private String compatibleModels;
    private String unit;
    private Long preferredSupplierId;
    private String preferredSupplierName;
    private String alternateSuppliers;
    private BigDecimal purchasePrice;
    private BigDecimal landedCost;
    private BigDecimal sellingPrice;
    private Integer currentStock;
    private Integer reservedStock;
    private Integer availableStock;
    private Integer reorderLevel;
    private Integer lowStockThreshold;
    private String storageLocation;
    private String batchOrSerialNumber;
    private String warrantyInfo;
    private boolean lowStock;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
