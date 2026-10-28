package com.ims.entity.vehicle;

import com.ims.enums.VehicleStatus;
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
@Table(name = "vehicle_status_history", indexes = {
        @Index(name = "idx_hist_vehicle_date", columnList = "vehicle_id, changed_at")
})
public class VehicleStatusHistoryEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 40)
    private VehicleStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 40)
    private VehicleStatus newStatus;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant changedAt = Instant.now();
}
