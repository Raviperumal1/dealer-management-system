package com.ims.repository.broker;

import com.ims.entity.broker.BrokerVehicleListingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrokerVehicleListingRepository extends JpaRepository<BrokerVehicleListingEntity, Long>, JpaSpecificationExecutor<BrokerVehicleListingEntity> {
    Optional<BrokerVehicleListingEntity> findByVehicleId(Long vehicleId);
    List<BrokerVehicleListingEntity> findByBrokerId(Long brokerId);
    long countByBrokerId(Long brokerId);
}
