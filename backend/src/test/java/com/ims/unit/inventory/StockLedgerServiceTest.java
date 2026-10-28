package com.ims.unit.inventory;

import com.ims.entity.inventory.PartEntity;
import com.ims.entity.inventory.StockMovementEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.PartCategory;
import com.ims.enums.StockMovementType;
import com.ims.exception.InsufficientStockException;
import com.ims.repository.inventory.PartRepository;
import com.ims.repository.inventory.StockMovementRepository;
import com.ims.service.impl.inventory.StockLedgerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockLedgerServiceTest {

    @Mock
    private PartRepository partRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private StockLedgerServiceImpl stockLedgerService;

    private PartEntity batteryPart;

    @BeforeEach
    void setUp() {
        batteryPart = PartEntity.builder()
                .sku("BAT-12V-EXIDE")
                .name("Exide 12V 45Ah Battery")
                .category(PartCategory.PART)
                .unit("PCS")
                .purchasePrice(BigDecimal.valueOf(4500.00))
                .sellingPrice(BigDecimal.valueOf(5500.00))
                .currentStock(0)
                .lowStockThreshold(2)
                .build();
        batteryPart.setId(50L);
    }

    @Test
    @DisplayName("Scenario 4: Purchase 10 units -> Stock = 10; Consume 1 unit -> Stock = 9 (10 - 1 = 9)")
    void testScenario4_StockIncreaseAndDecrease() {
        // Step 1: Stock In 10 units
        when(partRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(batteryPart));
        when(partRepository.save(any(PartEntity.class))).thenAnswer(i -> i.getArgument(0));

        PartEntity afterPurchase = stockLedgerService.recordStockIn(
                50L,
                10,
                "INV-2026-001",
                "Purchase invoice posted",
                "admin"
        );

        assertEquals(10, afterPurchase.getCurrentStock());
        verify(stockMovementRepository, times(1)).save(any(StockMovementEntity.class));

        // Step 2: Stock Out 1 unit in vehicle repair
        when(partRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(batteryPart));

        PartEntity afterConsumption = stockLedgerService.recordStockOut(
                50L,
                1,
                StockMovementType.JOB_CARD_USAGE,
                "JC-2026-001",
                mock(VehicleEntity.class),
                "Battery installed in vehicle",
                "mechanic"
        );

        // Assert: 10 - 1 = 9
        assertEquals(9, afterConsumption.getCurrentStock());
        verify(stockMovementRepository, times(2)).save(any(StockMovementEntity.class));
    }

    @Test
    @DisplayName("Insufficient Stock: Throws InsufficientStockException when consuming more than available")
    void testNegativeStockPrevention() {
        batteryPart.setCurrentStock(2);
        when(partRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(batteryPart));

        assertThrows(InsufficientStockException.class, () ->
                stockLedgerService.recordStockOut(
                        50L,
                        5, // Attempting to consume 5 when only 2 available
                        StockMovementType.JOB_CARD_USAGE,
                        "JC-ERR-001",
                        null,
                        "Excess consumption",
                        "staff"
                )
        );

        // Verify stock was not reduced
        assertEquals(2, batteryPart.getCurrentStock());
    }
}
