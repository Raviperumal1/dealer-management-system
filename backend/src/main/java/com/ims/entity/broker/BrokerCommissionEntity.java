package com.ims.entity.broker;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.CommissionType;
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
@Table(name = "broker_commissions")
public class BrokerCommissionEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "broker_id", nullable = false)
    private BrokerEntity broker;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "sale_id", nullable = false, unique = true)
    private Long saleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_type", nullable = false, length = 20)
    private CommissionType commissionType;

    @Column(name = "sale_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "broker_settlement_basis", nullable = false, precision = 14, scale = 2)
    private BigDecimal brokerSettlementBasis;

    @Column(name = "gross_commission", nullable = false, precision = 14, scale = 2)
    private BigDecimal grossCommission;

    @Column(name = "shop_repair_deduction", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal shopRepairDeduction = BigDecimal.ZERO;

    @Column(name = "other_shop_expense_deduction", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal otherShopExpenseDeduction = BigDecimal.ZERO;

    @Column(name = "net_commission", nullable = false, precision = 14, scale = 2)
    private BigDecimal netCommission;

    @Column(name = "calculated_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
