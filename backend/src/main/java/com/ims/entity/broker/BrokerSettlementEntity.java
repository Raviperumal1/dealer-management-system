package com.ims.entity.broker;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.SettlementStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "broker_settlements", indexes = {
        @Index(name = "idx_bs_status", columnList = "settlement_status")
})
public class BrokerSettlementEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "broker_id", nullable = false)
    private BrokerEntity broker;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "sale_id", nullable = false, unique = true)
    private Long saleId;

    @Column(name = "sale_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal saleAmount;

    @Column(name = "broker_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal brokerAmount;

    @Column(name = "gross_commission", nullable = false, precision = 14, scale = 2)
    private BigDecimal grossCommission;

    @Column(name = "other_deductions", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "net_payable", nullable = false, precision = 14, scale = 2)
    private BigDecimal netPayable;

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_status", nullable = false, length = 30)
    @Builder.Default
    private SettlementStatus settlementStatus = SettlementStatus.PENDING;

    @OneToMany(mappedBy = "settlement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BrokerSettlementPaymentEntity> payments = new ArrayList<>();
}
