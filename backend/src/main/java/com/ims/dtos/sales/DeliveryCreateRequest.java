package com.ims.dtos.sales;

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
public class DeliveryCreateRequest {

    @NotNull(message = "Delivery date is required")
    private LocalDate deliveryDate;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    @NotBlank(message = "Recipient phone is required")
    private String recipientPhone;

    @NotNull(message = "Odometer reading at delivery is required")
    @Min(value = 0, message = "Odometer reading must be non-negative")
    private Integer odometerAtDelivery;

    private String documentPath;
    private String notes;
}
