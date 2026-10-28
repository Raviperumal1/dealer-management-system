package com.ims.dtos.inventory;

import com.ims.enums.StockMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementResponse {

    private Long id;
    private Long partId;
    private String partSku;
    private String partName;
    private StockMovementType movementType;
    private Integer quantity;
    private Integer balanceAfter;
    private String referenceDocument;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String reason;
    private String createdBy;
    private Instant createdAt;
}
