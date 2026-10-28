package com.ims.dtos.service;

import com.ims.enums.FollowUpStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpUpdateRequest {

    private String outcome;
    private LocalDate nextFollowUpDate;
    private String remarks;
    private String assignedStaff;
    private FollowUpStatus status;
}
