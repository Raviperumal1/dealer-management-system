package com.ims.repository.finance;

import com.ims.entity.finance.FinanceApplicationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinanceApplicationRepository extends JpaRepository<FinanceApplicationEntity, Long>, JpaSpecificationExecutor<FinanceApplicationEntity> {
    Optional<FinanceApplicationEntity> findByApplicationNumber(String applicationNumber);
    List<FinanceApplicationEntity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<FinanceApplicationEntity> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);
    Page<FinanceApplicationEntity> findByStatus(String status, Pageable pageable);
    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(fa.disbursedAmount), 0) FROM FinanceApplicationEntity fa WHERE fa.disbursementDate >= :start AND fa.disbursementDate <= :end AND fa.status = 'DISBURSED'")
    java.math.BigDecimal sumDisbursedAmountBetween(@org.springframework.data.repository.query.Param("start") java.time.LocalDate start, @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);
}
