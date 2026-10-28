package com.ims.entity.vehicle;

import com.ims.entity.base.BaseEntity;
import com.ims.enums.FuelType;
import com.ims.enums.OwnershipType;
import com.ims.enums.TransmissionType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_reg", columnList = "registration_number", unique = true),
        @Index(name = "idx_vehicle_status", columnList = "status"),
        @Index(name = "idx_vehicle_ownership", columnList = "ownership_type"),
        @Index(name = "idx_vehicle_brand_model", columnList = "brand, model")
})
public class VehicleEntity extends BaseEntity {

    @Column(name = "registration_number", nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private VehicleType vehicleType; // CAR, BIKE

    @Column(name = "brand", nullable = false, length = 100)
    private String brand;

    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @Column(name = "variant", length = 100)
    private String variant;

    @Column(name = "manufacturing_year", nullable = false)
    private Integer manufacturingYear;

    @Column(name = "registration_year", nullable = false)
    private Integer registrationYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 30)
    private FuelType fuelType; // PETROL, DIESEL, ELECTRIC, HYBRID, CNG

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission", nullable = false, length = 30)
    private TransmissionType transmission; // MANUAL, AUTOMATIC

    @Column(name = "color", nullable = false, length = 50)
    private String color;

    @Column(name = "odometer_reading", nullable = false)
    @Builder.Default
    private Integer odometerReading = 0;

    @Column(name = "chassis_number", nullable = false, unique = true, length = 100)
    private String chassisNumber;

    @Column(name = "engine_number", nullable = false, unique = true, length = 100)
    private String engineNumber;

    @Column(name = "rc_number", length = 100)
    private String rcNumber;

    @Column(name = "rc_expiry_date")
    private LocalDate rcExpiryDate;

    @Column(name = "insurance_policy_number", length = 100)
    private String insurancePolicyNumber;

    @Column(name = "insurance_validity_date")
    private LocalDate insuranceValidityDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "ownership_type", nullable = false, length = 20)
    private OwnershipType ownershipType; // OWN, BROKER

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private VehicleStatus status;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @OneToOne(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VehiclePurchaseEntity purchase;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VehicleDocumentEntity> documents = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VehiclePhotoEntity> photos = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VehicleStatusHistoryEntity> statusHistory = new ArrayList<>();
}
