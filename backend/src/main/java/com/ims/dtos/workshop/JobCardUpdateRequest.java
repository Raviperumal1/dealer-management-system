package com.ims.dtos.workshop;

import com.ims.enums.CostResponsibility;
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
public class JobCardUpdateRequest {

    private String assignedStaff;
    private LocalDate completionDate;
    private CostResponsibility costResponsibility;
    private BigDecimal shopCost;
    private BigDecimal brokerCost;
    private BigDecimal totalCost;
    private String remarks;
    private List<JobCardCreateRequest.JobCardTaskRequest> tasks;
    private List<JobCardCreateRequest.JobCardPartRequest> parts;
    private List<JobCardCreateRequest.JobCardLabourRequest> labour;
}
