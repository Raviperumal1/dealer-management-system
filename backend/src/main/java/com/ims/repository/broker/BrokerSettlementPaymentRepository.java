package com.ims.repository.broker;

import com.ims.entity.broker.BrokerSettlementPaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrokerSettlementPaymentRepository extends JpaRepository<BrokerSettlementPaymentEntity, Long> {
    List<BrokerSettlementPaymentEntity> findBySettlementId(Long settlementId);
}
