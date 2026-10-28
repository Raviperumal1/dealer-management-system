package com.ims.entity.broker;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.CommissionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "broker_vehicle_listings")
public class BrokerVehicleListingEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "broker_id", nullable = false)
    private BrokerEntity broker;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "asking_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal askingPrice;

    @Column(name = "expected_selling_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal expectedSellingPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_type", nullable = false, length = 20)
    private CommissionType commissionType; // FIXED, PERCENTAGE

    @Column(name = "commission_rate", nullable = false, precision = 14, scale = 2)
    private BigDecimal commissionRate; // e.g. 25000 for FIXED, or 3.00 for PERCENTAGE

    @Column(name = "listing_date", nullable = false)
    private LocalDate listingDate;

    @Column(name = "listing_status", nullable = false, length = 30)
    @Builder.Default
    private String listingStatus = "ACTIVE";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
