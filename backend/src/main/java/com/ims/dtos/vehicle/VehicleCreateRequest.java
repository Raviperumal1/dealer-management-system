package com.ims.dtos.vehicle;

import com.ims.enums.CommissionType;
import com.ims.enums.FuelType;
import com.ims.enums.OwnershipType;
import com.ims.enums.TransmissionType;
import com.ims.enums.VehicleType;
import jakarta.validation.constraints.*;
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
public class VehicleCreateRequest {

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotNull(message = "Vehicle type is required (CAR, BIKE)")
    private VehicleType vehicleType;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    private String variant;

    @NotNull(message = "Manufacturing year is required")
    @Min(value = 1990, message = "Manufacturing year must be >= 1990")
    private Integer manufacturingYear;

    @NotNull(message = "Registration year is required")
    @Min(value = 1990, message = "Registration year must be >= 1990")
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

    @NotBlank(message = "Chassis number is required")
    private String chassisNumber;

    @NotBlank(message = "Engine number is required")
    private String engineNumber;

    private String rcNumber;
    private LocalDate rcExpiryDate;
    private String insurancePolicyNumber;
    private LocalDate insuranceValidityDate;

    @NotNull(message = "Ownership type is required (OWN, BROKER)")
    private OwnershipType ownershipType;

    // Required if OwnershipType == OWN
    private LocalDate purchaseDate;
    private String sellerName;
    private String sellerPhone;
    private String sellerAddress;
    private BigDecimal purchasePrice;
    private BigDecimal purchaseExpenses;
    private String purchaseNotes;

    // Required if OwnershipType == BROKER
    private Long brokerId;
    private BigDecimal brokerAskingPrice;
    private BigDecimal expectedSellingPrice;
    private CommissionType commissionType; // FIXED, PERCENTAGE
    private BigDecimal commissionRate;
    private LocalDate listingDate;
    private String listingNotes;
}
