package com.ims.repository.broker;

import com.ims.entity.broker.BrokerCommissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrokerCommissionRepository extends JpaRepository<BrokerCommissionEntity, Long> {
    Optional<BrokerCommissionEntity> findByVehicleId(Long vehicleId);
    Optional<BrokerCommissionEntity> findBySaleId(Long saleId);
}
