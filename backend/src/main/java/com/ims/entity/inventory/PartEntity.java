package com.ims.entity.inventory;

import com.ims.entity.base.BaseEntity;
import com.ims.enums.CompatibleVehicleType;
import com.ims.enums.PartCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "parts", indexes = {
        @Index(name = "idx_part_sku", columnList = "sku", unique = true),
        @Index(name = "idx_part_category", columnList = "category"),
        @Index(name = "idx_part_brand", columnList = "manufacturer_brand")
})
public class PartEntity extends BaseEntity {

    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private PartCategory category; // PART, ACCESSORY

    @Column(name = "manufacturer_brand", length = 100)
    private String manufacturerBrand;

    @Column(name = "part_number", length = 100)
    private String partNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "compatible_vehicle_type", length = 30)
    @Builder.Default
    private CompatibleVehicleType compatibleVehicleType = CompatibleVehicleType.FOUR_WHEELER;

    @Column(name = "compatible_models", length = 255)
    private String compatibleModels;

    @Column(name = "unit", nullable = false, length = 20)
    @Builder.Default
    private String unit = "PCS"; // PCS, LTR, SET

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_supplier_id")
    private SupplierEntity preferredSupplier;

    @Column(name = "alternate_suppliers", length = 255)
    private String alternateSuppliers;

    @Column(name = "purchase_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "landed_cost", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal landedCost = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "current_stock", nullable = false)
    @Builder.Default
    private Integer currentStock = 0;

    @Column(name = "reserved_stock", nullable = false)
    @Builder.Default
    private Integer reservedStock = 0;

    @Column(name = "reorder_level", nullable = false)
    @Builder.Default
    private Integer reorderLevel = 5;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Column(name = "storage_location", length = 100)
    private String storageLocation;

    @Column(name = "batch_or_serial_number", length = 100)
    private String batchOrSerialNumber;

    @Column(name = "warranty_info", length = 255)
    private String warrantyInfo;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    public Integer getAvailableStock() {
        int avail = (currentStock != null ? currentStock : 0) - (reservedStock != null ? reservedStock : 0);
        return Math.max(0, avail);
    }
}
