package com.ims.repository.finance;

import com.ims.entity.finance.LoanDocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanDocumentRepository extends JpaRepository<LoanDocumentEntity, Long>, JpaSpecificationExecutor<LoanDocumentEntity> {
    List<LoanDocumentEntity> findByFinanceDetailIdOrderByCreatedAtDesc(Long financeDetailId);
    List<LoanDocumentEntity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<LoanDocumentEntity> findByDocumentReference(String documentReference);
    Optional<LoanDocumentEntity> findFirstByFinanceDetailIdAndDocumentTypeAndIsActiveTrue(Long financeDetailId, String documentType);
}
