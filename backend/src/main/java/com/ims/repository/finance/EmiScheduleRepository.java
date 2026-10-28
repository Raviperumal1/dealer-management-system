package com.ims.repository.finance;

import com.ims.entity.finance.EmiScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmiScheduleRepository extends JpaRepository<EmiScheduleEntity, Long> {
    List<EmiScheduleEntity> findByFinanceDetailIdOrderByInstallmentNumberAsc(Long financeDetailId);

    @Query("SELECT e FROM EmiScheduleEntity e LEFT JOIN FETCH e.financeDetail fd LEFT JOIN FETCH fd.sale s LEFT JOIN FETCH s.customer c LEFT JOIN FETCH s.vehicle v WHERE e.dueDate < :today AND e.status = 'PENDING'")
    List<EmiScheduleEntity> findOverdueEmis(@Param("today") LocalDate today);

    List<EmiScheduleEntity> findByPaidDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(e.emiAmount), 0) FROM EmiScheduleEntity e WHERE e.paidDate >= :start AND e.paidDate <= :end AND e.status = 'PAID'")
    BigDecimal sumEmiCollectionsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(e.principalAmount), 0) FROM EmiScheduleEntity e WHERE e.paidDate >= :start AND e.paidDate <= :end AND e.status = 'PAID'")
    BigDecimal sumPrincipalCollectionsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(e.interestAmount), 0) FROM EmiScheduleEntity e WHERE e.paidDate >= :start AND e.paidDate <= :end AND e.status = 'PAID'")
    BigDecimal sumInterestCollectionsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    List<EmiScheduleEntity> findByStatus(String status);
}
