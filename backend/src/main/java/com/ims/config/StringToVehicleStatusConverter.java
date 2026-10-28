package com.ims.config;

import com.ims.enums.VehicleStatus;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToVehicleStatusConverter implements Converter<String, VehicleStatus> {

    @Override
    public VehicleStatus convert(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        String normalized = source.trim().toUpperCase();
        if ("UNDER_INSPECTION".equals(normalized)) {
            return VehicleStatus.INSPECTION;
        }
        if ("UNDER_REPAIR".equals(normalized)) {
            return VehicleStatus.REPAIR;
        }
        return VehicleStatus.valueOf(normalized);
    }
}
