package com.ims.dtos.finance;

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
public class LoanDocumentResponse {
    private Long id;
    private String documentReference;
    private Long financeId;
    private String loanAccountNumber;
    private Long customerId;
    private String customerName;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleName;
    private String category;
    private String documentType;
    private String title;
    private String fileKey;
    private String downloadUrl;
    private String originalFilename;
    private Long fileSize;
    private String contentType;
    private LocalDate issueDate;
    private String version;
    private String verificationStatus;
    private String notes;
    private Boolean isActive;
    private String createdByUser;
    private Instant createdAt;
}
