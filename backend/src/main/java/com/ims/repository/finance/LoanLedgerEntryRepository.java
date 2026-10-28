package com.ims.repository.finance;

import com.ims.entity.finance.LoanLedgerEntryEntity;
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
public interface LoanLedgerEntryRepository extends JpaRepository<LoanLedgerEntryEntity, Long>, JpaSpecificationExecutor<LoanLedgerEntryEntity> {

    List<LoanLedgerEntryEntity> findByFinanceDetailIdOrderByEffectiveDateAscIdAsc(Long financeId);

    Page<LoanLedgerEntryEntity> findByFinanceDetailIdOrderByEffectiveDateDescIdDesc(Long financeId, Pageable pageable);

    Optional<LoanLedgerEntryEntity> findByTransactionId(String transactionId);

    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT lle FROM LoanLedgerEntryEntity lle WHERE lle.financeDetail.id = :financeId ORDER BY lle.effectiveDate DESC, lle.id DESC LIMIT 1")
    Optional<LoanLedgerEntryEntity> findLatestByFinanceId(@Param("financeId") Long financeId);

    @Query("SELECT COALESCE(SUM(lle.amount), 0) FROM LoanLedgerEntryEntity lle WHERE lle.effectiveDate >= :start AND lle.effectiveDate <= :end AND lle.status = 'POSTED' AND lle.entryDirection = 'CREDIT'")
    BigDecimal sumCreditCollectionsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(lle.amount), 0) FROM LoanLedgerEntryEntity lle WHERE lle.effectiveDate >= :start AND lle.effectiveDate <= :end AND lle.status = 'POSTED' AND lle.transactionType = 'FORECLOSURE_SETTLEMENT'")
    BigDecimal sumSettlementsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(lle.amount), 0) FROM LoanLedgerEntryEntity lle WHERE lle.status = 'POSTED' AND lle.entryDirection = 'CREDIT'")
    BigDecimal sumTotalRepaidCumulative();
}
