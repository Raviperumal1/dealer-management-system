package com.ims.service.serviceInterface.inventory;

import com.ims.entity.inventory.PartEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.StockMovementType;

public interface StockLedgerService {
    PartEntity recordStockIn(Long partId, int quantity, String referenceDoc, String reason, String username);
    PartEntity recordStockOut(Long partId, int quantity, StockMovementType movementType, String referenceDoc, VehicleEntity vehicle, String reason, String username);
    PartEntity recordStockReturn(Long partId, int quantity, String referenceDoc, VehicleEntity vehicle, String reason, String username);
    PartEntity recordReversal(Long partId, int quantity, String originalReferenceDoc, VehicleEntity vehicle, String reason, String username);
}
