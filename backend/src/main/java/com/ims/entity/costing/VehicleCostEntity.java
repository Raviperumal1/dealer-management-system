package com.ims.entity.costing;

import com.ims.entity.vehicle.VehicleEntity;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "vehicle_costs")
public class VehicleCostEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "purchase_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "purchase_expenses", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal purchaseExpenses = BigDecimal.ZERO;

    @Column(name = "shop_repair_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal shopRepairCost = BigDecimal.ZERO;

    @Column(name = "accessories_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal accessoriesCost = BigDecimal.ZERO;

    @Column(name = "labour_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal labourCost = BigDecimal.ZERO;

    @Column(name = "other_expenses", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal otherExpenses = BigDecimal.ZERO;

    @Column(name = "total_vehicle_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalVehicleCost = BigDecimal.ZERO;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
