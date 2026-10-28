package com.ims.service.impl.vehicle;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehicleStatusHistoryEntity;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.exception.InvalidStateTransitionException;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.vehicle.VehicleStatusHistoryRepository;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatusWorkflowServiceImpl implements StatusWorkflowService {

    private final VehicleRepository vehicleRepository;
    private final VehicleStatusHistoryRepository historyRepository;
    private final com.ims.repository.workshop.JobCardRepository jobCardRepository;
    private final com.ims.repository.workshop.InspectionRepository inspectionRepository;

    private static final Map<VehicleStatus, Set<VehicleStatus>> OWN_TRANSITIONS = new EnumMap<>(VehicleStatus.class);
    private static final Map<VehicleStatus, Set<VehicleStatus>> BROKER_TRANSITIONS = new EnumMap<>(VehicleStatus.class);

    static {
        // Own vehicle state transitions
        OWN_TRANSITIONS.put(VehicleStatus.PURCHASED, EnumSet.of(VehicleStatus.INSPECTION, VehicleStatus.JOB_CARD, VehicleStatus.READY_FOR_SALE));
        OWN_TRANSITIONS.put(VehicleStatus.INSPECTION, EnumSet.of(VehicleStatus.JOB_CARD, VehicleStatus.REPAIR, VehicleStatus.READY_FOR_SALE));
        OWN_TRANSITIONS.put(VehicleStatus.JOB_CARD, EnumSet.of(VehicleStatus.REPAIR, VehicleStatus.READY_FOR_SALE));
        OWN_TRANSITIONS.put(VehicleStatus.REPAIR, EnumSet.of(VehicleStatus.READY_FOR_SALE));
        OWN_TRANSITIONS.put(VehicleStatus.READY_FOR_SALE, EnumSet.of(VehicleStatus.AVAILABLE, VehicleStatus.BOOKED, VehicleStatus.SOLD));
        OWN_TRANSITIONS.put(VehicleStatus.AVAILABLE, EnumSet.of(VehicleStatus.BOOKED, VehicleStatus.SOLD));
        OWN_TRANSITIONS.put(VehicleStatus.BOOKED, EnumSet.of(VehicleStatus.AVAILABLE, VehicleStatus.SOLD));
        OWN_TRANSITIONS.put(VehicleStatus.SOLD, EnumSet.of(VehicleStatus.DELIVERED));
        OWN_TRANSITIONS.put(VehicleStatus.DELIVERED, EnumSet.of(VehicleStatus.SERVICE_FOLLOWUP));
        OWN_TRANSITIONS.put(VehicleStatus.SERVICE_FOLLOWUP, EnumSet.noneOf(VehicleStatus.class));

        // Broker vehicle state transitions
        BROKER_TRANSITIONS.put(VehicleStatus.BROKER_LISTED, EnumSet.of(VehicleStatus.INSPECTION, VehicleStatus.JOB_CARD, VehicleStatus.READY_FOR_SALE));
        BROKER_TRANSITIONS.put(VehicleStatus.INSPECTION, EnumSet.of(VehicleStatus.JOB_CARD, VehicleStatus.REPAIR, VehicleStatus.READY_FOR_SALE));
        BROKER_TRANSITIONS.put(VehicleStatus.JOB_CARD, EnumSet.of(VehicleStatus.REPAIR, VehicleStatus.READY_FOR_SALE));
        BROKER_TRANSITIONS.put(VehicleStatus.REPAIR, EnumSet.of(VehicleStatus.READY_FOR_SALE));
        BROKER_TRANSITIONS.put(VehicleStatus.READY_FOR_SALE, EnumSet.of(VehicleStatus.AVAILABLE, VehicleStatus.BOOKED, VehicleStatus.SOLD));
        BROKER_TRANSITIONS.put(VehicleStatus.AVAILABLE, EnumSet.of(VehicleStatus.BOOKED, VehicleStatus.SOLD));
        BROKER_TRANSITIONS.put(VehicleStatus.BOOKED, EnumSet.of(VehicleStatus.AVAILABLE, VehicleStatus.SOLD));
        BROKER_TRANSITIONS.put(VehicleStatus.SOLD, EnumSet.of(VehicleStatus.SETTLEMENT_PENDING, VehicleStatus.SETTLED, VehicleStatus.DELIVERED));
        BROKER_TRANSITIONS.put(VehicleStatus.SETTLEMENT_PENDING, EnumSet.of(VehicleStatus.SETTLED, VehicleStatus.DELIVERED));
        BROKER_TRANSITIONS.put(VehicleStatus.SETTLED, EnumSet.of(VehicleStatus.DELIVERED));
        BROKER_TRANSITIONS.put(VehicleStatus.DELIVERED, EnumSet.of(VehicleStatus.SERVICE_FOLLOWUP));
        BROKER_TRANSITIONS.put(VehicleStatus.SERVICE_FOLLOWUP, EnumSet.noneOf(VehicleStatus.class));
    }

    @Override
    public boolean isValidTransition(VehicleEntity vehicle, VehicleStatus targetStatus) {
        if (vehicle == null || targetStatus == null) return false;
        if (vehicle.getStatus() == targetStatus) return true; // idempotent

        Map<VehicleStatus, Set<VehicleStatus>> transitionMap = (vehicle.getOwnershipType() == OwnershipType.OWN)
                ? OWN_TRANSITIONS
                : BROKER_TRANSITIONS;

        Set<VehicleStatus> allowed = transitionMap.get(vehicle.getStatus());
        return allowed != null && allowed.contains(targetStatus);
    }

    @Override
    @Transactional
    public void validateAndTransition(VehicleEntity vehicle, VehicleStatus targetStatus, String reason, String username) {
        VehicleStatus currentStatus = vehicle.getStatus();
        if (currentStatus == targetStatus) {
            log.debug("Vehicle [{}] already in status [{}]", vehicle.getRegistrationNumber(), targetStatus);
            return;
        }

        if (!isValidTransition(vehicle, targetStatus)) {
            throw new InvalidStateTransitionException(
                    currentStatus.name(),
                    targetStatus.name(),
                    String.format("Transition not allowed for ownership type [%s]. Vehicle: %s",
                            vehicle.getOwnershipType(), vehicle.getRegistrationNumber())
            );
        }

        // Sale-Readiness Guardrails: Enforce completion of inspections and active job cards before READY_FOR_SALE
        if (targetStatus == VehicleStatus.READY_FOR_SALE) {
            // 1. Check for active/unresolved job cards
            List<com.ims.entity.workshop.JobCardEntity> activeCards = jobCardRepository.findByVehicleId(vehicle.getId()).stream()
                    .filter(jc -> jc.getStatus() == com.ims.enums.JobCardStatus.OPEN
                            || jc.getStatus() == com.ims.enums.JobCardStatus.IN_PROGRESS
                            || jc.getStatus() == com.ims.enums.JobCardStatus.WAITING_FOR_PARTS)
                    .collect(java.util.stream.Collectors.toList());

            if (!activeCards.isEmpty()) {
                throw new com.ims.exception.BusinessRuleViolationException(String.format(
                        "Cannot mark vehicle [%s] READY_FOR_SALE: %d unresolved workshop job card(s) still in progress.",
                        vehicle.getRegistrationNumber(), activeCards.size()
                ));
            }

            // 2. Check for failed/incomplete inspection items
            List<com.ims.entity.workshop.InspectionEntity> inspections = inspectionRepository.findByVehicleId(vehicle.getId());
            boolean hasUnresolvedInspectionIssues = inspections.stream().anyMatch(ins ->
                    ins.getItems() != null && ins.getItems().stream().anyMatch(item ->
                            item.getResult() == com.ims.enums.InspectionResult.REPLACE
                                    || item.getResult() == com.ims.enums.InspectionResult.NEED_REPAIR
                    )
            );

            // If there were inspection defects but no completed job card resolving them
            boolean hasCompletedJobCard = jobCardRepository.findByVehicleId(vehicle.getId()).stream()
                    .anyMatch(jc -> jc.getStatus() == com.ims.enums.JobCardStatus.COMPLETED || jc.getStatus() == com.ims.enums.JobCardStatus.CLOSED);

            if (hasUnresolvedInspectionIssues && !hasCompletedJobCard) {
                throw new com.ims.exception.BusinessRuleViolationException(String.format(
                        "Cannot mark vehicle [%s] READY_FOR_SALE: Safety/repair inspection findings have not been resolved by a completed job card.",
                        vehicle.getRegistrationNumber()
                ));
            }
        }

        vehicle.setStatus(targetStatus);
        vehicleRepository.save(vehicle);

        VehicleStatusHistoryEntity history = VehicleStatusHistoryEntity.builder()
                .vehicle(vehicle)
                .previousStatus(currentStatus)
                .newStatus(targetStatus)
                .reason(reason)
                .changedBy(username != null ? username : "SYSTEM")
                .changedAt(Instant.now())
                .build();

        historyRepository.save(history);
        log.info("Vehicle [{}] transitioned from [{}] to [{}] by user [{}]. Reason: {}",
                vehicle.getRegistrationNumber(), currentStatus, targetStatus, username, reason);
    }
}
