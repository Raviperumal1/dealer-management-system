package com.ims.dtos.inventory;

import com.ims.enums.CompatibleVehicleType;
import com.ims.enums.PartCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartUpdateRequest {

    private String name;
    private PartCategory category;
    private String manufacturerBrand;
    private String partNumber;
    private CompatibleVehicleType compatibleVehicleType;
    private String compatibleModels;
    private String unit;
    private Long preferredSupplierId;
    private String alternateSuppliers;
    private BigDecimal purchasePrice;
    private BigDecimal landedCost;
    private BigDecimal sellingPrice;
    private Integer reorderLevel;
    private Integer lowStockThreshold;
    private String storageLocation;
    private String batchOrSerialNumber;
    private String warrantyInfo;
    private Boolean active;
}
