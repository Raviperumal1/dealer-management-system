package com.ims.dtos.service;

import com.ims.enums.FollowUpStatus;
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
public class FollowUpCreateRequest {

    private Long serviceRecordId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Follow-up date is required")
    private LocalDate followUpDate;

    private String outcome;
    private LocalDate nextFollowUpDate;
    private String remarks;
    private String assignedStaff;
    private FollowUpStatus status;
}
