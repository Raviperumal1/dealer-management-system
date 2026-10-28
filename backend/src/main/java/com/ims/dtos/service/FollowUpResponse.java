package com.ims.dtos.service;

import com.ims.enums.FollowUpStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpResponse {

    private Long id;
    private Long serviceRecordId;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private LocalDate followUpDate;
    private String outcome;
    private LocalDate nextFollowUpDate;
    private String remarks;
    private String assignedStaff;
    private FollowUpStatus status;
    private Instant createdAt;
}
