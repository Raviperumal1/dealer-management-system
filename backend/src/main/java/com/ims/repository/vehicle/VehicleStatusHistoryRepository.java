package com.ims.repository.vehicle;

import com.ims.entity.vehicle.VehicleStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleStatusHistoryRepository extends JpaRepository<VehicleStatusHistoryEntity, Long> {
    List<VehicleStatusHistoryEntity> findByVehicleIdOrderByChangedAtDesc(Long vehicleId);
}
