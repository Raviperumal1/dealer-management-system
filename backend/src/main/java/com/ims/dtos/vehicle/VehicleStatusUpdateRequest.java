package com.ims.dtos.vehicle;

import com.ims.enums.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatusUpdateRequest {

    @NotNull(message = "Target status is required")
    private VehicleStatus status;

    private String reason;
}
