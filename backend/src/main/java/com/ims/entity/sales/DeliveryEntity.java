package com.ims.entity.sales;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "deliveries")
public class DeliveryEntity extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false, unique = true)
    private SaleEntity sale;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "recipient_name", nullable = false, length = 150)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 30)
    private String recipientPhone;

    @Column(name = "odometer_at_delivery", nullable = false)
    private Integer odometerAtDelivery;

    @Column(name = "delivery_status", nullable = false, length = 30)
    @Builder.Default
    private String deliveryStatus = "DELIVERED"; // SCHEDULED, DELIVERED

    @Column(name = "document_path", length = 255)
    private String documentPath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "delivered_at", nullable = false)
    @Builder.Default
    private Instant deliveredAt = Instant.now();
}
