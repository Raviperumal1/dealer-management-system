package com.ims.dtos.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleReportRow {
    private Long vehicleId;
    private String registrationNumber;
    private String vehicleType;
    private String brand;
    private String model;
    private String variant;
    private Integer manufacturingYear;
    private String fuelType;
    private String ownershipType;
    private String status;
    private Integer odometerReading;
    private LocalDate purchaseOrListingDate;
    private BigDecimal purchasePriceOrAskingPrice;
}
