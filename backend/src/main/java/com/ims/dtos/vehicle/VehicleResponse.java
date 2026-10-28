package com.ims.dtos.vehicle;

import com.ims.enums.FuelType;
import com.ims.enums.OwnershipType;
import com.ims.enums.TransmissionType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
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
public class VehicleResponse {

    private Long id;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private String variant;
    private Integer manufacturingYear;
    private Integer registrationYear;
    private FuelType fuelType;
    private TransmissionType transmission;
    private String color;
    private Integer odometerReading;
    private String chassisNumber;
    private String engineNumber;
    private String rcNumber;
    private LocalDate rcExpiryDate;
    private String insurancePolicyNumber;
    private LocalDate insuranceValidityDate;
    private OwnershipType ownershipType;
    private VehicleStatus status;
    private String primaryPhotoUrl;
    private BigDecimal sellingPrice;
    private String type;
    private String ownership;
    private Integer odometerKm;

    // Own vehicle purchase summary (if applicable)
    private PurchaseSummaryDto purchase;
    private BigDecimal purchasePrice;
    private LocalDate purchaseDate;
    private String sellerName;
    private String sellerPhone;
    private BigDecimal purchaseExpenses;
    private BigDecimal brokerAskingPrice;

    // Broker listing summary (if applicable)
    private BrokerListingSummaryDto brokerListing;

    private List<PhotoDto> photos;
    private List<DocumentDto> documents;

    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseSummaryDto {
        private Long id;
        private LocalDate purchaseDate;
        private String sellerName;
        private String sellerPhone;
        private BigDecimal purchasePrice;
        private BigDecimal purchaseExpenses;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrokerListingSummaryDto {
        private Long id;
        private Long brokerId;
        private String brokerName;
        private BigDecimal askingPrice;
        private BigDecimal expectedSellingPrice;
        private String commissionType;
        private BigDecimal commissionRate;
        private LocalDate listingDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoDto {
        private Long id;
        private String photoUrl;
        private boolean primary;
        private String caption;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentDto {
        private Long id;
        private String documentType;
        private String documentName;
        private String filePath;
        private Long fileSize;
        private String contentType;
    }
}
