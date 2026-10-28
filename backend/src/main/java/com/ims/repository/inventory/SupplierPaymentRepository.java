package com.ims.repository.inventory;

import com.ims.entity.inventory.SupplierPaymentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierPaymentRepository extends JpaRepository<SupplierPaymentEntity, Long>, JpaSpecificationExecutor<SupplierPaymentEntity> {
    Optional<SupplierPaymentEntity> findByPaymentCode(String paymentCode);
    boolean existsByPaymentCode(String paymentCode);
    List<SupplierPaymentEntity> findBySupplierId(Long supplierId);
    Page<SupplierPaymentEntity> findBySupplierId(Long supplierId, Pageable pageable);
    List<SupplierPaymentEntity> findByInvoiceId(Long invoiceId);

    @Query("SELECT COALESCE(SUM(sp.amount), 0) FROM SupplierPaymentEntity sp WHERE sp.supplier.id = :supplierId")
    BigDecimal sumPaymentsBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COALESCE(SUM(sp.amount), 0) FROM SupplierPaymentEntity sp WHERE sp.invoice.id = :invoiceId")
    BigDecimal sumPaymentsByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT COALESCE(SUM(sp.unallocatedAmount), 0) FROM SupplierPaymentEntity sp WHERE sp.supplier.id = :supplierId AND sp.advance = true")
    BigDecimal sumUnallocatedAdvanceBySupplierId(@Param("supplierId") Long supplierId);
}
