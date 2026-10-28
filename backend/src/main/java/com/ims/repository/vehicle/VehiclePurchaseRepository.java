package com.ims.repository.vehicle;

import com.ims.entity.vehicle.VehiclePurchaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehiclePurchaseRepository extends JpaRepository<VehiclePurchaseEntity, Long> {
    Optional<VehiclePurchaseEntity> findByVehicleId(Long vehicleId);
    List<VehiclePurchaseEntity> findByPurchaseDate(LocalDate date);
    List<VehiclePurchaseEntity> findByPurchaseDateBetween(LocalDate startDate, LocalDate endDate);
}
