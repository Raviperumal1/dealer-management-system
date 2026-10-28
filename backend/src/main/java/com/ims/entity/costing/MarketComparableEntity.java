package com.ims.entity.costing;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
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
@Table(name = "market_comparables", indexes = {
        @Index(name = "idx_mc_vehicle_id", columnList = "vehicle_id"),
        @Index(name = "idx_mc_make_model", columnList = "make, model")
})
public class MarketComparableEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @Column(name = "make", nullable = false, length = 100)
    private String make;

    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @Column(name = "variant", length = 100)
    private String variant;

    @Column(name = "manufacturing_year")
    private Integer manufacturingYear;

    @Column(name = "registration_year")
    private Integer registrationYear;

    @Column(name = "fuel_type", length = 30)
    private String fuelType;

    @Column(name = "transmission", length = 30)
    private String transmission;

    @Column(name = "odometer_reading")
    private Integer odometerReading;

    @Column(name = "vehicle_condition", length = 50)
    private String vehicleCondition; // EXCELLENT, GOOD, FAIR, POOR

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "asking_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal askingPrice;

    @Column(name = "listing_source", length = 100)
    private String listingSource; // e.g. CarWale, Spinny, OLX, Local Dealer

    @Column(name = "listing_url", length = 255)
    private String listingUrl;

    @Column(name = "observation_date", nullable = false)
    private LocalDate observationDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user", length = 100)
    private String createdByUser;
}
