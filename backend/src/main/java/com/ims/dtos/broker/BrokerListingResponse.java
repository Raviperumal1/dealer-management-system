package com.ims.dtos.broker;

import com.ims.dtos.vehicle.VehicleResponse;
import com.ims.enums.CommissionType;
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
public class BrokerListingResponse {

    private Long id;
    private Long brokerId;
    private String brokerName;
    private Long vehicleId;
    private VehicleResponse vehicle;
    private BigDecimal askingPrice;
    private BigDecimal expectedSellingPrice;
    private CommissionType commissionType;
    private BigDecimal commissionRate;
    private LocalDate listingDate;
    private String listingStatus;
    private String notes;
    private Instant createdAt;
}
