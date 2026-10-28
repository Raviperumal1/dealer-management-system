package com.ims.mapper;

import com.ims.dtos.vehicle.VehicleResponse;
import com.ims.entity.broker.BrokerVehicleListingEntity;
import com.ims.entity.vehicle.VehicleDocumentEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehiclePhotoEntity;
import com.ims.entity.vehicle.VehiclePurchaseEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class VehicleMapper {

    public VehicleResponse toResponse(VehicleEntity entity) {
        if (entity == null) {
            return null;
        }

        String primaryPhoto = null;
        if (entity.getPhotos() != null) {
            primaryPhoto = entity.getPhotos().stream()
                    .filter(VehiclePhotoEntity::isPrimary)
                    .map(VehiclePhotoEntity::getPhotoUrl)
                    .findFirst()
                    .orElse(entity.getPhotos().isEmpty() ? null : entity.getPhotos().get(0).getPhotoUrl());
        }

        VehicleResponse.PurchaseSummaryDto purchaseDto = null;
        if (entity.getPurchase() != null) {
            VehiclePurchaseEntity p = entity.getPurchase();
            purchaseDto = VehicleResponse.PurchaseSummaryDto.builder()
                    .id(p.getId())
                    .purchaseDate(p.getPurchaseDate())
                    .sellerName(p.getSellerName())
                    .sellerPhone(p.getSellerPhone())
                    .purchasePrice(p.getPurchasePrice())
                    .purchaseExpenses(p.getPurchaseExpenses())
                    .build();
        }

        List<VehicleResponse.PhotoDto> photoDtos = entity.getPhotos() == null ? Collections.emptyList() :
                entity.getPhotos().stream().map(photo -> VehicleResponse.PhotoDto.builder()
                        .id(photo.getId())
                        .photoUrl(photo.getPhotoUrl())
                        .primary(photo.isPrimary())
                        .caption(photo.getCaption())
                        .build()
                ).collect(Collectors.toList());

        List<VehicleResponse.DocumentDto> docDtos = entity.getDocuments() == null ? Collections.emptyList() :
                entity.getDocuments().stream().map(doc -> VehicleResponse.DocumentDto.builder()
                        .id(doc.getId())
                        .documentType(doc.getDocumentType())
                        .documentName(doc.getDocumentName())
                        .filePath(doc.getFilePath())
                        .fileSize(doc.getFileSize())
                        .contentType(doc.getContentType())
                        .build()
                ).collect(Collectors.toList());

        return VehicleResponse.builder()
                .id(entity.getId())
                .registrationNumber(entity.getRegistrationNumber())
                .vehicleType(entity.getVehicleType())
                .brand(entity.getBrand())
                .model(entity.getModel())
                .variant(entity.getVariant())
                .manufacturingYear(entity.getManufacturingYear())
                .registrationYear(entity.getRegistrationYear())
                .fuelType(entity.getFuelType())
                .transmission(entity.getTransmission())
                .color(entity.getColor())
                .odometerReading(entity.getOdometerReading())
                .chassisNumber(entity.getChassisNumber())
                .engineNumber(entity.getEngineNumber())
                .rcNumber(entity.getRcNumber())
                .rcExpiryDate(entity.getRcExpiryDate())
                .insurancePolicyNumber(entity.getInsurancePolicyNumber())
                .insuranceValidityDate(entity.getInsuranceValidityDate())
                .ownershipType(entity.getOwnershipType())
                .status(entity.getStatus())
                .primaryPhotoUrl(primaryPhoto)
                .type(entity.getVehicleType() != null ? entity.getVehicleType().name() : null)
                .ownership(entity.getOwnershipType() != null ? entity.getOwnershipType().name() : null)
                .odometerKm(entity.getOdometerReading())
                .sellingPrice(purchaseDto != null ? purchaseDto.getPurchasePrice() : java.math.BigDecimal.ZERO)
                .purchase(purchaseDto)
                .purchasePrice(purchaseDto != null ? purchaseDto.getPurchasePrice() : null)
                .purchaseDate(purchaseDto != null ? purchaseDto.getPurchaseDate() : null)
                .sellerName(purchaseDto != null ? purchaseDto.getSellerName() : null)
                .sellerPhone(purchaseDto != null ? purchaseDto.getSellerPhone() : null)
                .purchaseExpenses(purchaseDto != null ? purchaseDto.getPurchaseExpenses() : null)
                .photos(photoDtos)
                .documents(docDtos)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public VehicleResponse toResponse(VehicleEntity entity, BrokerVehicleListingEntity listing) {
        VehicleResponse response = toResponse(entity);
        if (response != null && listing != null) {
            response.setSellingPrice(listing.getExpectedSellingPrice() != null ? listing.getExpectedSellingPrice() : listing.getAskingPrice());
            response.setBrokerAskingPrice(listing.getAskingPrice());
            response.setBrokerListing(VehicleResponse.BrokerListingSummaryDto.builder()
                    .id(listing.getId())
                    .brokerId(listing.getBroker().getId())
                    .brokerName(listing.getBroker().getName())
                    .askingPrice(listing.getAskingPrice())
                    .expectedSellingPrice(listing.getExpectedSellingPrice())
                    .commissionType(listing.getCommissionType() != null ? listing.getCommissionType().name() : null)
                    .commissionRate(listing.getCommissionRate())
                    .listingDate(listing.getListingDate())
                    .build());
        }
        return response;
    }
}
