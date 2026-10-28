package com.ims.enums;

public enum VehicleStatus {
    PURCHASED,
    BROKER_LISTED,
    INSPECTION,
    JOB_CARD,
    REPAIR,
    READY_FOR_SALE,
    AVAILABLE,
    BOOKED,
    SOLD,
    SETTLEMENT_PENDING,
    SETTLED,
    DELIVERED,
    SERVICE_FOLLOWUP;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static VehicleStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if ("UNDER_INSPECTION".equals(normalized)) {
            return INSPECTION;
        }
        if ("UNDER_REPAIR".equals(normalized)) {
            return REPAIR;
        }
        return VehicleStatus.valueOf(normalized);
    }
}
