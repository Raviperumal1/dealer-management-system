package com.ims.dtos.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceReportRow {
    private Long serviceId;
    private String serviceNumber;
    private LocalDate serviceDate;
    private String customerName;
    private String customerMobile;
    private String vehicleRegistrationNumber;
    private Integer currentKm;
    private BigDecimal labourAmount;
    private BigDecimal partsAmount;
    private BigDecimal totalAmount;
    private LocalDate nextServiceDate;
    private Integer nextServiceKm;
    private String status;
    private String assignedStaff;
}
