package com.ims.entity.inventory;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.StockMovementType;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "stock_movements", indexes = {
        @Index(name = "idx_sm_part_date", columnList = "part_id, created_at")
})
public class StockMovementEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private PartEntity part;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private StockMovementType movementType; // PURCHASE_IN, JOB_CARD_USAGE, SERVICE_USAGE, ADJUSTMENT

    @Column(name = "quantity", nullable = false)
    private Integer quantity; // Positive for IN, Negative for OUT

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(name = "reference_document", length = 100)
    private String referenceDocument; // e.g. "INV-1001", "JC-2026-0001", "SRV-2026-0001"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
