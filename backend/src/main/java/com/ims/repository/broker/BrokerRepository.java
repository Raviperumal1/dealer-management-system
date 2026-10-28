package com.ims.repository.broker;

import com.ims.entity.broker.BrokerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrokerRepository extends JpaRepository<BrokerEntity, Long>, JpaSpecificationExecutor<BrokerEntity> {
    Optional<BrokerEntity> findByMobile(String mobile);
    boolean existsByMobile(String mobile);
}
