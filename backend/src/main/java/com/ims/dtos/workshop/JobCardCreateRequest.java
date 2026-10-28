package com.ims.dtos.workshop;

import com.ims.enums.CostResponsibility;
import jakarta.validation.constraints.NotBlank;
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
public class JobCardCreateRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long inspectionId;

    private String assignedStaff;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate completionDate;

    @NotNull(message = "Cost responsibility is required (SHOP, BROKER, SHARED)")
    @Builder.Default
    private CostResponsibility costResponsibility = CostResponsibility.SHOP;

    private BigDecimal shopCost;
    private BigDecimal brokerCost;
    private BigDecimal totalCost;

    private String remarks;

    private List<JobCardTaskRequest> tasks;
    private List<JobCardPartRequest> parts;
    private List<JobCardLabourRequest> labour;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardTaskRequest {
        @NotBlank(message = "Task description is required")
        private String taskDescription;
        private BigDecimal estimatedCost;
        private BigDecimal actualCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardPartRequest {
        @NotNull(message = "Part ID is required")
        private Long partId;
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        private BigDecimal unitPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardLabourRequest {
        @NotBlank(message = "Labour description is required")
        private String description;
        private BigDecimal labourHours;
        private BigDecimal hourlyRate;
    }
}
