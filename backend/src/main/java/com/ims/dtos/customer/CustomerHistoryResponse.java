package com.ims.dtos.customer;

import com.ims.dtos.sales.PaymentResponse;
import com.ims.dtos.sales.SaleResponse;
import com.ims.dtos.workshop.JobCardResponse;
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
public class CustomerHistoryResponse {

    private Long customerId;
    private String customerName;
    private String mobile;
    private String email;
    private String address;

    private List<SaleHistoryItem> sales;
    private List<BookingHistoryItem> bookings;
    private List<ServiceHistoryItem> serviceRecords;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleHistoryItem {
        private Long saleId;
        private String saleNumber;
        private LocalDate saleDate;
        private String saleType;
        private Long vehicleId;
        private String vehicleRegistrationNumber;
        private String vehicleBrand;
        private String vehicleModel;
        private String ownershipType;
        private BigDecimal finalSalePrice;
        private String status;
        private List<PaymentResponse> payments;
        private boolean delivered;
        private LocalDate deliveryDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingHistoryItem {
        private Long bookingId;
        private String bookingNumber;
        private Long vehicleId;
        private String vehicleRegistrationNumber;
        private BigDecimal advanceAmount;
        private LocalDate bookingDate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceHistoryItem {
        private Long serviceId;
        private String serviceNumber;
        private LocalDate serviceDate;
        private Integer currentKm;
        private String customerComplaint;
        private BigDecimal totalAmount;
        private LocalDate nextServiceDate;
        private Integer nextServiceKm;
        private String status;
    }
}
