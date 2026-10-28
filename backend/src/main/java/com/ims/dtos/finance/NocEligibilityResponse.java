package com.ims.dtos.finance;

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
public class NocEligibilityResponse {
    private Long loanId;
    private String loanAccountNumber;
    private String customerName;
    private String vehicleRegistrationNumber;
    private String loanStatus;
    private boolean eligible;
    private String ineligibilityReason;
    private BigDecimal principalOutstanding;
    private int unpaidInstallmentCount;
    private boolean alreadyIssued;
    private String existingNocReference;
    private LocalDate existingNocIssueDate;
    private String existingNocDownloadUrl;
    private List<String> clearanceChecklist;

    // Rich vehicle, customer & loan verification fields
    private Long customerId;
    private String customerAddress;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleYear;
    private String chassisNumber;
    private String engineNumber;
    private BigDecimal sanctionedAmount;
    private LocalDate loanStartDate;
    private LocalDate loanClosureDate;
    private String lenderName;
}

