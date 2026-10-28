package com.ims.repository.inventory;

import com.ims.entity.inventory.PartEntity;
import com.ims.enums.PartCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<PartEntity, Long>, JpaSpecificationExecutor<PartEntity> {

    Optional<PartEntity> findBySku(String sku);
    boolean existsBySku(String sku);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PartEntity p WHERE p.id = :id")
    Optional<PartEntity> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT p FROM PartEntity p WHERE p.currentStock <= p.lowStockThreshold AND p.active = true")
    List<PartEntity> findLowStockParts();

    @Query("SELECT COUNT(p) FROM PartEntity p WHERE p.currentStock <= p.lowStockThreshold AND p.active = true")
    long countLowStockParts();

    @Query("SELECT COALESCE(SUM(p.currentStock * p.purchasePrice), 0) FROM PartEntity p WHERE p.active = true")
    BigDecimal sumInventoryValuation();

    List<PartEntity> findByCategory(PartCategory category);
}
