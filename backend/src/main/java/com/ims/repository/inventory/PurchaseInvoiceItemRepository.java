package com.ims.repository.inventory;

import com.ims.entity.inventory.PurchaseInvoiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseInvoiceItemRepository extends JpaRepository<PurchaseInvoiceItemEntity, Long> {
    List<PurchaseInvoiceItemEntity> findByInvoiceId(Long invoiceId);
}
