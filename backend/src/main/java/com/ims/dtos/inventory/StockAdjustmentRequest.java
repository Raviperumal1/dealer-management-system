package com.ims.dtos.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "Part ID is required")
    private Long partId;

    @NotNull(message = "Adjustment quantity is required")
    private Integer quantity; // Positive to add, negative to deduct

    @NotBlank(message = "Reason is required")
    private String reason;

    private Long vehicleId; // Optional if adjustment is linked to a vehicle
}
