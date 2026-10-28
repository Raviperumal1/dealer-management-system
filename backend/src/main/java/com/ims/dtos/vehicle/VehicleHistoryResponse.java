package com.ims.dtos.vehicle;

import com.ims.enums.VehicleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleHistoryResponse {

    private Long id;
    private Long vehicleId;
    private VehicleStatus previousStatus;
    private VehicleStatus newStatus;
    private String reason;
    private String changedBy;
    private Instant changedAt;
}
