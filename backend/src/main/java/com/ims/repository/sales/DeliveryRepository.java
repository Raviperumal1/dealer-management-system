package com.ims.repository.sales;

import com.ims.entity.sales.DeliveryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<DeliveryEntity, Long>, JpaSpecificationExecutor<DeliveryEntity> {
    Optional<DeliveryEntity> findBySaleId(Long saleId);
    Optional<DeliveryEntity> findByVehicleId(Long vehicleId);
}
