package com.ims.dtos.service;

import com.ims.enums.ServiceStatus;
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
public class ServiceRecordResponse {

    private Long id;
    private String serviceNumber;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private Long saleId;
    private LocalDate serviceDate;
    private Integer currentKm;
    private String customerComplaint;
    private String inspectionNotes;
    private BigDecimal labourAmount;
    private BigDecimal partsAmount;
    private BigDecimal totalAmount;
    private LocalDate nextServiceDate;
    private Integer nextServiceKm;
    private ServiceStatus status;
    private String assignedStaff;
    private List<ServicePartResponse> parts;
    private Instant createdAt;
}
