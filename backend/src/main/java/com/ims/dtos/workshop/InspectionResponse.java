package com.ims.dtos.workshop;

import com.ims.enums.InspectionResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String inspectorName;
    private LocalDate inspectionDate;
    private String overallRemarks;
    private InspectionResult overallResult;
    private List<CheckpointItemDto> checkpoints;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckpointItemDto {
        private Long id;
        private String checkpointName;
        private InspectionResult result;
        private String remarks;
        private BigDecimal estimatedCost;
    }
}
