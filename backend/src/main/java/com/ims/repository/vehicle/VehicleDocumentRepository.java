package com.ims.repository.vehicle;

import com.ims.entity.vehicle.VehicleDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleDocumentRepository extends JpaRepository<VehicleDocumentEntity, Long> {
    List<VehicleDocumentEntity> findByVehicleId(Long vehicleId);
}
