package com.ims.service.impl.inventory;

import com.ims.entity.inventory.PartEntity;
import com.ims.entity.inventory.StockMovementEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.StockMovementType;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.InsufficientStockException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.inventory.PartRepository;
import com.ims.repository.inventory.StockMovementRepository;
import com.ims.service.serviceInterface.inventory.StockLedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockLedgerServiceImpl implements StockLedgerService {

    private final PartRepository partRepository;
    private final StockMovementRepository stockMovementRepository;

    @Override
    @Transactional
    public synchronized PartEntity recordStockIn(Long partId, int quantity, String referenceDoc, String reason, String username) {
        if (quantity <= 0) {
            throw new BusinessRuleViolationException("Quantity must be greater than zero for stock receipt");
        }

        PartEntity part = partRepository.findByIdForUpdate(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", partId));

        int newStock = part.getCurrentStock() + quantity;
        part.setCurrentStock(newStock);
        PartEntity savedPart = partRepository.save(part);

        StockMovementEntity movement = StockMovementEntity.builder()
                .part(savedPart)
                .movementType(StockMovementType.PURCHASE_IN)
                .quantity(quantity)
                .balanceAfter(newStock)
                .referenceDocument(referenceDoc)
                .reason(reason)
                .createdBy(username != null ? username : "SYSTEM")
                .createdAt(Instant.now())
                .build();

        stockMovementRepository.save(movement);
        log.info("Stock IN: {} units of [{}] (SKU: {}). New Balance: {}", quantity, part.getName(), part.getSku(), newStock);

        return savedPart;
    }

    @Override
    @Transactional
    public synchronized PartEntity recordStockOut(Long partId, int quantity, StockMovementType movementType, String referenceDoc, VehicleEntity vehicle, String reason, String username) {
        if (quantity <= 0) {
            throw new BusinessRuleViolationException("Quantity must be greater than zero for stock issue");
        }

        PartEntity part = partRepository.findByIdForUpdate(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", partId));

        if (part.getCurrentStock() < quantity) {
            throw new InsufficientStockException(part.getSku(), quantity, part.getCurrentStock());
        }

        int newStock = part.getCurrentStock() - quantity;
        part.setCurrentStock(newStock);
        PartEntity savedPart = partRepository.save(part);

        StockMovementEntity movement = StockMovementEntity.builder()
                .part(savedPart)
                .movementType(movementType)
                .quantity(-quantity)
                .balanceAfter(newStock)
                .referenceDocument(referenceDoc)
                .vehicle(vehicle)
                .reason(reason)
                .createdBy(username != null ? username : "SYSTEM")
                .createdAt(Instant.now())
                .build();

        stockMovementRepository.save(movement);
        log.info("Stock OUT: {} units of [{}] (SKU: {}) for ref [{}]. New Balance: {}",
                quantity, part.getName(), part.getSku(), referenceDoc, newStock);

        return savedPart;
    }

    @Override
    @Transactional
    public synchronized PartEntity recordStockReturn(Long partId, int quantity, String referenceDoc, VehicleEntity vehicle, String reason, String username) {
        if (quantity <= 0) {
            throw new BusinessRuleViolationException("Quantity must be greater than zero for stock return");
        }

        PartEntity part = partRepository.findByIdForUpdate(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", partId));

        int newStock = part.getCurrentStock() + quantity;
        part.setCurrentStock(newStock);
        PartEntity savedPart = partRepository.save(part);

        StockMovementEntity movement = StockMovementEntity.builder()
                .part(savedPart)
                .movementType(StockMovementType.JOB_CARD_RETURN)
                .quantity(quantity)
                .balanceAfter(newStock)
                .referenceDocument(referenceDoc)
                .vehicle(vehicle)
                .reason(reason != null ? reason : "Return to inventory for ref: " + referenceDoc)
                .createdBy(username != null ? username : "SYSTEM")
                .createdAt(Instant.now())
                .build();

        stockMovementRepository.save(movement);
        log.info("Stock RETURN: {} units of [{}] (SKU: {}) for ref [{}]. Restored Balance: {}",
                quantity, part.getName(), part.getSku(), referenceDoc, newStock);

        return savedPart;
    }

    @Override
    @Transactional
    public synchronized PartEntity recordReversal(Long partId, int quantity, String originalReferenceDoc, VehicleEntity vehicle, String reason, String username) {
        if (quantity <= 0) {
            throw new BusinessRuleViolationException("Quantity must be greater than zero for stock reversal");
        }

        PartEntity part = partRepository.findByIdForUpdate(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", partId));

        int newStock = part.getCurrentStock() + quantity;
        part.setCurrentStock(newStock);
        PartEntity savedPart = partRepository.save(part);

        StockMovementEntity compensatingMovement = StockMovementEntity.builder()
                .part(savedPart)
                .movementType(StockMovementType.ADJUSTMENT)
                .quantity(quantity)
                .balanceAfter(newStock)
                .referenceDocument("REV-" + originalReferenceDoc)
                .vehicle(vehicle)
                .reason(reason != null ? reason : "Compensating reversal for duplicate or cancelled issue: " + originalReferenceDoc)
                .createdBy(username != null ? username : "SYSTEM")
                .createdAt(Instant.now())
                .build();

        stockMovementRepository.save(compensatingMovement);
        log.info("Stock COMPENSATING REVERSAL: {} units of [{}] (SKU: {}) for original ref [{}]. Corrected Balance: {}",
                quantity, part.getName(), part.getSku(), originalReferenceDoc, newStock);

        return savedPart;
    }
}
