package com.ims.repository.finance;

import com.ims.entity.finance.FinanceDetailEntity;
import com.ims.enums.FinanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinanceDetailRepository extends JpaRepository<FinanceDetailEntity, Long>, JpaSpecificationExecutor<FinanceDetailEntity> {
    Optional<FinanceDetailEntity> findBySaleId(Long saleId);
    List<FinanceDetailEntity> findByStatus(FinanceStatus status);
    long countByStatus(FinanceStatus status);
}
