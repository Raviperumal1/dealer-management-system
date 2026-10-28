package com.ims.dtos.sales;

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
public class DeliveryResponse {

    private Long id;
    private Long saleId;
    private String saleNumber;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private LocalDate deliveryDate;
    private String recipientName;
    private String recipientPhone;
    private Integer odometerAtDelivery;
    private String deliveryStatus;
    private String documentPath;
    private String notes;
    private Instant deliveredAt;
}
