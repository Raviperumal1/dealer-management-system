package com.ims.dtos.inventory;

import com.ims.enums.CompatibleVehicleType;
import com.ims.enums.PartCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartCreateRequest {

    @NotBlank(message = "Part SKU is required")
    private String sku;

    @NotBlank(message = "Part name is required")
    private String name;

    @NotNull(message = "Category is required")
    private PartCategory category;

    private String manufacturerBrand;
    private String partNumber;
    private CompatibleVehicleType compatibleVehicleType;
    private String compatibleModels;

    private String unit;
    private Long preferredSupplierId;
    private String alternateSuppliers;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price must be positive")
    private BigDecimal purchasePrice;

    private BigDecimal landedCost;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Selling price must be positive")
    private BigDecimal sellingPrice;

    private Integer initialStock;
    private Integer reorderLevel;
    private Integer lowStockThreshold;
    private String storageLocation;
    private String batchOrSerialNumber;
    private String warrantyInfo;
}
