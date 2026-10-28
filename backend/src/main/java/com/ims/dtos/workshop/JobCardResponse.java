package com.ims.dtos.workshop;

import com.ims.enums.CostResponsibility;
import com.ims.enums.JobCardStatus;
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
public class JobCardResponse {

    private Long id;
    private String jobCardNumber;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private Long inspectionId;
    private String assignedStaff;
    private LocalDate startDate;
    private LocalDate completionDate;
    private JobCardStatus status;
    private CostResponsibility costResponsibility;
    private BigDecimal shopCost;
    private BigDecimal brokerCost;
    private BigDecimal totalCost;
    private String remarks;
    private List<JobCardTaskDto> tasks;
    private List<JobCardPartDto> parts;
    private List<JobCardLabourDto> labourEntries;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardTaskDto {
        private Long id;
        private String taskDescription;
        private BigDecimal estimatedCost;
        private BigDecimal actualCost;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardPartDto {
        private Long id;
        private Long partId;
        private String partSku;
        private String partName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobCardLabourDto {
        private Long id;
        private String description;
        private BigDecimal labourHours;
        private BigDecimal hourlyRate;
        private BigDecimal totalAmount;
    }
}
