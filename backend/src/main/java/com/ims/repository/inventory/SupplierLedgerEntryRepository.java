package com.ims.repository.inventory;

import com.ims.entity.inventory.SupplierLedgerEntryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierLedgerEntryRepository extends JpaRepository<SupplierLedgerEntryEntity, Long>, JpaSpecificationExecutor<SupplierLedgerEntryEntity> {
    List<SupplierLedgerEntryEntity> findBySupplierIdOrderByEntryDateAscIdAsc(Long supplierId);
    Page<SupplierLedgerEntryEntity> findBySupplierIdOrderByEntryDateDescIdDesc(Long supplierId, Pageable pageable);

    @Query("SELECT sle FROM SupplierLedgerEntryEntity sle WHERE sle.supplier.id = :supplierId ORDER BY sle.entryDate DESC, sle.id DESC LIMIT 1")
    Optional<SupplierLedgerEntryEntity> findLatestBySupplierId(@Param("supplierId") Long supplierId);
}
