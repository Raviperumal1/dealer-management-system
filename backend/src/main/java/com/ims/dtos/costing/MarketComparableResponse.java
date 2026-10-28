package com.ims.dtos.costing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketComparableResponse {

    private Long id;
    private Long vehicleId;
    private String make;
    private String model;
    private String variant;
    private Integer manufacturingYear;
    private Integer registrationYear;
    private String fuelType;
    private String transmission;
    private Integer odometerReading;
    private String vehicleCondition;
    private String location;
    private BigDecimal askingPrice;
    private String listingSource;
    private String listingUrl;
    private LocalDate observationDate;
    private String notes;
    private String createdByUser;
    private Instant createdAt;
}
