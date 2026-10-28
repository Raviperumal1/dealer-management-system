package com.ims.repository.inventory;

import com.ims.entity.inventory.StockMovementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovementEntity, Long>, JpaSpecificationExecutor<StockMovementEntity> {
    List<StockMovementEntity> findByPartIdOrderByCreatedAtDesc(Long partId);
    List<StockMovementEntity> findByVehicleId(Long vehicleId);
}
