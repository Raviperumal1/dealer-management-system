package com.ims.dtos.broker;

import com.ims.enums.CommissionType;
import jakarta.validation.constraints.NotNull;
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
public class BrokerListingCreateRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Broker asking price is required")
    private BigDecimal askingPrice;

    @NotNull(message = "Expected selling price is required")
    private BigDecimal expectedSellingPrice;

    @NotNull(message = "Commission type is required (FIXED, PERCENTAGE)")
    private CommissionType commissionType;

    @NotNull(message = "Commission rate is required")
    private BigDecimal commissionRate;

    @NotNull(message = "Listing date is required")
    private LocalDate listingDate;

    private String notes;
}
