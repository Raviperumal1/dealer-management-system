package com.ims.repository.inventory;

import com.ims.entity.inventory.PurchaseInvoiceEntity;
import com.ims.enums.PurchaseBillStatus;
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
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoiceEntity, Long>, JpaSpecificationExecutor<PurchaseInvoiceEntity> {
    Optional<PurchaseInvoiceEntity> findByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumber(String invoiceNumber);
    boolean existsBySupplierIdAndSupplierInvoiceNumber(Long supplierId, String supplierInvoiceNumber);
    List<PurchaseInvoiceEntity> findBySupplierId(Long supplierId);
    List<PurchaseInvoiceEntity> findByVehicleId(Long vehicleId);

    @Query("SELECT COALESCE(SUM(pi.totalAmount), 0) FROM PurchaseInvoiceEntity pi WHERE pi.supplier.id = :supplierId AND pi.status = :status")
    BigDecimal sumTotalBySupplierIdAndStatus(@Param("supplierId") Long supplierId, @Param("status") PurchaseBillStatus status);

    @Query("SELECT COALESCE(SUM(pi.amountOutstanding), 0) FROM PurchaseInvoiceEntity pi WHERE pi.supplier.id = :supplierId AND pi.status = :status")
    BigDecimal sumOutstandingBySupplierIdAndStatus(@Param("supplierId") Long supplierId, @Param("status") PurchaseBillStatus status);

    @Query("SELECT COALESCE(SUM(pi.amountOutstanding), 0) FROM PurchaseInvoiceEntity pi WHERE pi.status = 'POSTED'")
    BigDecimal sumTotalOutstandingAcrossSuppliers();

    @Query("SELECT COALESCE(SUM(pi.amountOutstanding), 0) FROM PurchaseInvoiceEntity pi WHERE pi.status = 'POSTED' AND pi.dueDate < :today")
    BigDecimal sumOverdueAcrossSuppliers(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(pi.totalAmount), 0) FROM PurchaseInvoiceEntity pi WHERE pi.status = 'POSTED' AND pi.invoiceDate >= :startDate")
    BigDecimal sumPurchasesSince(@Param("startDate") LocalDate startDate);
}
