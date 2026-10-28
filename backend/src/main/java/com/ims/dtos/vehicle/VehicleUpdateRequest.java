package com.ims.dtos.vehicle;

import com.ims.enums.FuelType;
import com.ims.enums.TransmissionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleUpdateRequest {

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    private String variant;

    @NotNull(message = "Manufacturing year is required")
    private Integer manufacturingYear;

    @NotNull(message = "Registration year is required")
    private Integer registrationYear;

    @NotNull(message = "Fuel type is required")
    private FuelType fuelType;

    @NotNull(message = "Transmission is required")
    private TransmissionType transmission;

    @NotBlank(message = "Color is required")
    private String color;

    @NotNull(message = "Odometer reading is required")
    @Min(value = 0, message = "Odometer reading must be non-negative")
    private Integer odometerReading;

    private String rcNumber;
    private LocalDate rcExpiryDate;
    private String insurancePolicyNumber;
    private LocalDate insuranceValidityDate;
}
