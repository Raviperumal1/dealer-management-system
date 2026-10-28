package com.ims.dtos.sales;

import jakarta.validation.constraints.DecimalMin;
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
public class BookingCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Advance amount is required")
    @DecimalMin(value = "1.00", message = "Advance amount must be greater than zero")
    private BigDecimal advanceAmount;

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    private LocalDate expiryDate;
    private String notes;
}
