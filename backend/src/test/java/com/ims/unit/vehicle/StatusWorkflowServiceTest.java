package com.ims.unit.vehicle;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehicleStatusHistoryEntity;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.exception.InvalidStateTransitionException;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.vehicle.VehicleStatusHistoryRepository;
import com.ims.service.impl.vehicle.StatusWorkflowServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatusWorkflowServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private VehicleStatusHistoryRepository historyRepository;
    @Mock
    private com.ims.repository.workshop.JobCardRepository jobCardRepository;
    @Mock
    private com.ims.repository.workshop.InspectionRepository inspectionRepository;

    @InjectMocks
    private StatusWorkflowServiceImpl workflowService;

    private VehicleEntity ownVehicle;
    private VehicleEntity brokerVehicle;

    @BeforeEach
    void setUp() {
        ownVehicle = VehicleEntity.builder()
                .registrationNumber("KA01AB1234")
                .ownershipType(OwnershipType.OWN)
                .status(VehicleStatus.PURCHASED)
                .build();
        ownVehicle.setId(1L);

        brokerVehicle = VehicleEntity.builder()
                .registrationNumber("DL04EF9876")
                .ownershipType(OwnershipType.BROKER)
                .status(VehicleStatus.BROKER_LISTED)
                .build();
        brokerVehicle.setId(2L);
    }

    @Test
    @DisplayName("Own Vehicle Lifecycle: PURCHASED -> INSPECTION -> READY_FOR_SALE -> AVAILABLE -> SOLD -> DELIVERED")
    void testOwnVehicleValidTransitions() {
        when(vehicleRepository.save(any(VehicleEntity.class))).thenAnswer(i -> i.getArgument(0));

        // 1. PURCHASED -> INSPECTION
        workflowService.validateAndTransition(ownVehicle, VehicleStatus.INSPECTION, "Starting inspection", "inspector");
        assertEquals(VehicleStatus.INSPECTION, ownVehicle.getStatus());

        // 2. INSPECTION -> READY_FOR_SALE
        workflowService.validateAndTransition(ownVehicle, VehicleStatus.READY_FOR_SALE, "Passed inspection", "inspector");
        assertEquals(VehicleStatus.READY_FOR_SALE, ownVehicle.getStatus());

        // 3. READY_FOR_SALE -> AVAILABLE
        workflowService.validateAndTransition(ownVehicle, VehicleStatus.AVAILABLE, "Display in showroom", "admin");
        assertEquals(VehicleStatus.AVAILABLE, ownVehicle.getStatus());

        // 4. AVAILABLE -> SOLD
        workflowService.validateAndTransition(ownVehicle, VehicleStatus.SOLD, "Sold to customer", "salesperson");
        assertEquals(VehicleStatus.SOLD, ownVehicle.getStatus());

        // 5. SOLD -> DELIVERED
        workflowService.validateAndTransition(ownVehicle, VehicleStatus.DELIVERED, "Vehicle handed over", "deliveryStaff");
        assertEquals(VehicleStatus.DELIVERED, ownVehicle.getStatus());

        verify(historyRepository, times(5)).save(any(VehicleStatusHistoryEntity.class));
    }

    @Test
    @DisplayName("Illegal Transition Rejection: PURCHASED -> SOLD directly must throw InvalidStateTransitionException")
    void testIllegalTransitionThrowsException() {
        assertThrows(InvalidStateTransitionException.class, () ->
                workflowService.validateAndTransition(ownVehicle, VehicleStatus.SOLD, "Attempt direct sale without inspection/available", "user")
        );

        // Status must remain PURCHASED
        assertEquals(VehicleStatus.PURCHASED, ownVehicle.getStatus());
        verify(historyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Broker Vehicle Lifecycle: BROKER_LISTED -> AVAILABLE -> SOLD -> SETTLED -> DELIVERED")
    void testBrokerVehicleValidTransitions() {
        when(vehicleRepository.save(any(VehicleEntity.class))).thenAnswer(i -> i.getArgument(0));

        // BROKER_LISTED -> READY_FOR_SALE
        workflowService.validateAndTransition(brokerVehicle, VehicleStatus.READY_FOR_SALE, "Inspection clear", "admin");
        assertEquals(VehicleStatus.READY_FOR_SALE, brokerVehicle.getStatus());

        // READY_FOR_SALE -> AVAILABLE
        workflowService.validateAndTransition(brokerVehicle, VehicleStatus.AVAILABLE, "Listed on showroom floor", "admin");
        assertEquals(VehicleStatus.AVAILABLE, brokerVehicle.getStatus());

        // AVAILABLE -> SOLD
        workflowService.validateAndTransition(brokerVehicle, VehicleStatus.SOLD, "Broker vehicle sold", "salesperson");
        assertEquals(VehicleStatus.SOLD, brokerVehicle.getStatus());

        // SOLD -> SETTLED
        workflowService.validateAndTransition(brokerVehicle, VehicleStatus.SETTLED, "Broker payment completed", "accountant");
        assertEquals(VehicleStatus.SETTLED, brokerVehicle.getStatus());

        // SETTLED -> DELIVERED
        workflowService.validateAndTransition(brokerVehicle, VehicleStatus.DELIVERED, "Delivered to buyer", "deliveryStaff");
        assertEquals(VehicleStatus.DELIVERED, brokerVehicle.getStatus());
    }
}
