package com.ims.dtos.service;

import com.ims.enums.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
public class ServiceRecordCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long saleId;

    @NotNull(message = "Service date is required")
    private LocalDate serviceDate;

    @NotNull(message = "Current KM reading is required")
    @PositiveOrZero(message = "Current KM must be positive or zero")
    private Integer currentKm;

    private String customerComplaint;
    private String inspectionNotes;

    @PositiveOrZero(message = "Labour amount must be positive or zero")
    private BigDecimal labourAmount;

    private LocalDate nextServiceDate;
    private Integer nextServiceKm;
    private String assignedStaff;
    private ServiceStatus status;

    private List<ServicePartRequest> parts;
}
