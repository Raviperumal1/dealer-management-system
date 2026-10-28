package com.ims.service.serviceInterface.vehicle;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.VehicleStatus;

public interface StatusWorkflowService {
    void validateAndTransition(VehicleEntity vehicle, VehicleStatus targetStatus, String reason, String username);
    boolean isValidTransition(VehicleEntity vehicle, VehicleStatus targetStatus);
}
