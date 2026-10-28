package com.ims.mapper;

import com.ims.dtos.broker.BrokerListingResponse;
import com.ims.dtos.broker.BrokerResponse;
import com.ims.dtos.broker.SettlementResponse;
import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.broker.BrokerSettlementEntity;
import com.ims.entity.broker.BrokerVehicleListingEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class BrokerMapper {

    private final VehicleMapper vehicleMapper;

    public BrokerMapper(VehicleMapper vehicleMapper) {
        this.vehicleMapper = vehicleMapper;
    }

    public BrokerResponse toResponse(BrokerEntity entity, long listingCount) {
        if (entity == null) return null;

        return BrokerResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .mobile(entity.getMobile())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .idProofType(entity.getIdProofType())
                .notes(entity.getNotes())
                .active(entity.isActive())
                .totalListedVehicles(listingCount)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public BrokerListingResponse toListingResponse(BrokerVehicleListingEntity listing) {
        if (listing == null) return null;

        return BrokerListingResponse.builder()
                .id(listing.getId())
                .brokerId(listing.getBroker().getId())
                .brokerName(listing.getBroker().getName())
                .vehicleId(listing.getVehicle().getId())
                .vehicle(vehicleMapper.toResponse(listing.getVehicle(), listing))
                .askingPrice(listing.getAskingPrice())
                .expectedSellingPrice(listing.getExpectedSellingPrice())
                .commissionType(listing.getCommissionType())
                .commissionRate(listing.getCommissionRate())
                .listingDate(listing.getListingDate())
                .listingStatus(listing.getListingStatus())
                .notes(listing.getNotes())
                .createdAt(listing.getCreatedAt())
                .build();
    }

    public SettlementResponse toSettlementResponse(BrokerSettlementEntity entity) {
        if (entity == null) return null;

        List<SettlementResponse.PaymentItemDto> paymentDtos = entity.getPayments() == null ? Collections.emptyList() :
                entity.getPayments().stream().map(p -> SettlementResponse.PaymentItemDto.builder()
                        .id(p.getId())
                        .paymentDate(p.getPaymentDate())
                        .amount(p.getAmount())
                        .paymentMethod(p.getPaymentMethod())
                        .paymentReference(p.getPaymentReference())
                        .notes(p.getNotes())
                        .createdAt(p.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        return SettlementResponse.builder()
                .id(entity.getId())
                .brokerId(entity.getBroker().getId())
                .brokerName(entity.getBroker().getName())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .saleId(entity.getSaleId())
                .saleAmount(entity.getSaleAmount())
                .brokerAmount(entity.getBrokerAmount())
                .grossCommission(entity.getGrossCommission())
                .otherDeductions(entity.getOtherDeductions())
                .netPayable(entity.getNetPayable())
                .paidAmount(entity.getPaidAmount())
                .balanceAmount(entity.getBalanceAmount())
                .settlementStatus(entity.getSettlementStatus())
                .payments(paymentDtos)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
