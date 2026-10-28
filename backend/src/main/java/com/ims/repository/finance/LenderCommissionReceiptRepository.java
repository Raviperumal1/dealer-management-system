package com.ims.repository.finance;

import com.ims.entity.finance.LenderCommissionReceiptEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LenderCommissionReceiptRepository extends JpaRepository<LenderCommissionReceiptEntity, Long> {
    Optional<LenderCommissionReceiptEntity> findByReceiptReference(String receiptReference);
    Page<LenderCommissionReceiptEntity> findByLenderIdOrderByReceiptDateDesc(Long lenderId, Pageable pageable);
}
