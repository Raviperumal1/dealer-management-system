package com.ims.repository.finance;

import com.ims.entity.finance.LenderCommissionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LenderCommissionRepository extends JpaRepository<LenderCommissionEntity, Long>, JpaSpecificationExecutor<LenderCommissionEntity> {

    Optional<LenderCommissionEntity> findByCommissionReference(String commissionReference);

    Optional<LenderCommissionEntity> findByLoanApplicationId(Long loanApplicationId);

    List<LenderCommissionEntity> findByLenderIdOrderByEntryDateDesc(Long lenderId);

    Page<LenderCommissionEntity> findByStatusOrderByEntryDateDesc(String status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(c.grossCommission), 0) FROM LenderCommissionEntity c WHERE c.entryDate >= :start AND c.entryDate <= :end AND c.status <> 'REVERSED'")
    BigDecimal sumGrossCommissionBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(c.netReceivable), 0) FROM LenderCommissionEntity c WHERE c.status IN ('ACCRUED', 'APPROVED', 'INVOICED', 'PARTIALLY_SETTLED')")
    BigDecimal sumOutstandingReceivable();

    @Query("SELECT COALESCE(SUM(c.amountReceived), 0) FROM LenderCommissionEntity c WHERE c.entryDate >= :start AND c.entryDate <= :end")
    BigDecimal sumCommissionReceivedBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(c.tdsWithheld), 0) FROM LenderCommissionEntity c WHERE c.entryDate >= :start AND c.entryDate <= :end")
    BigDecimal sumTdsWithheldBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
