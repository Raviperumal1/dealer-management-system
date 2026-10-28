package com.ims.repository.broker;

import com.ims.entity.broker.BrokerSettlementEntity;
import com.ims.enums.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrokerSettlementRepository extends JpaRepository<BrokerSettlementEntity, Long>, JpaSpecificationExecutor<BrokerSettlementEntity> {
    Optional<BrokerSettlementEntity> findByVehicleId(Long vehicleId);
    Optional<BrokerSettlementEntity> findBySaleId(Long saleId);
    List<BrokerSettlementEntity> findByBrokerId(Long brokerId);
    List<BrokerSettlementEntity> findByBrokerIdAndSettlementStatus(Long brokerId, SettlementStatus status);
}
