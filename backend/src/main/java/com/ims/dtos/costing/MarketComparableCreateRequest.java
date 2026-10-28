package com.ims.dtos.costing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class MarketComparableCreateRequest {

    private Long vehicleId; // Optional vehicle to compare against

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    private String variant;
    private Integer manufacturingYear;
    private Integer registrationYear;
    private String fuelType;
    private String transmission;
    private Integer odometerReading;
    private String vehicleCondition;
    private String location;

    @NotNull(message = "Asking price is required")
    private BigDecimal askingPrice;

    private String listingSource;
    private String listingUrl;

    @NotNull(message = "Observation date is required")
    private LocalDate observationDate;

    private String notes;
}
