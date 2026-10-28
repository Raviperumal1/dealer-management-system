package com.ims.dtos.workshop;

import com.ims.enums.InspectionResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionCreateRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotBlank(message = "Inspector name is required")
    private String inspectorName;

    @NotNull(message = "Inspection date is required")
    private LocalDate inspectionDate;

    private String overallRemarks;

    @NotEmpty(message = "At least one inspection checkpoint item must be provided")
    private List<CheckpointItemRequest> checkpoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckpointItemRequest {
        @NotBlank(message = "Checkpoint name is required")
        private String checkpointName;

        @NotNull(message = "Checkpoint result is required (GOOD, NEED_REPAIR, REPLACE, NOT_AVAILABLE)")
        private InspectionResult result;

        private String remarks;
        private BigDecimal estimatedCost;
    }
}
