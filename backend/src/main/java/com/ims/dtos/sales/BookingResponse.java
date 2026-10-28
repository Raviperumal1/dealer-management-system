package com.ims.dtos.sales;

import com.ims.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private String bookingNumber;
    private Long customerId;
    private String customerName;
    private String customerMobile;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private BigDecimal advanceAmount;
    private LocalDate bookingDate;
    private LocalDate expiryDate;
    private BookingStatus status;
    private String notes;
    private Instant createdAt;
}
