package com.ims.repository.sales;

import com.ims.entity.sales.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
    Optional<PaymentEntity> findByReceiptNumber(String receiptNumber);
    Optional<PaymentEntity> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
    List<PaymentEntity> findBySaleId(Long saleId);
}
