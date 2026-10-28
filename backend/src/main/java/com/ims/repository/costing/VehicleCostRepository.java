package com.ims.repository.costing;

import com.ims.entity.costing.VehicleCostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleCostRepository extends JpaRepository<VehicleCostEntity, Long> {
    Optional<VehicleCostEntity> findByVehicleId(Long vehicleId);
}
