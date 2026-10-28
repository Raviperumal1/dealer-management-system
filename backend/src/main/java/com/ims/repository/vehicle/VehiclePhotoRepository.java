package com.ims.repository.vehicle;

import com.ims.entity.vehicle.VehiclePhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiclePhotoRepository extends JpaRepository<VehiclePhotoEntity, Long> {
    List<VehiclePhotoEntity> findByVehicleId(Long vehicleId);
}
