package com.ims.repository.inventory;

import com.ims.entity.inventory.SupplierEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<SupplierEntity, Long>, JpaSpecificationExecutor<SupplierEntity> {
    Optional<SupplierEntity> findByMobile(String mobile);
    boolean existsByMobile(String mobile);
    Optional<SupplierEntity> findBySupplierCode(String supplierCode);
    boolean existsBySupplierCode(String supplierCode);

    @Query("SELECT COUNT(s) FROM SupplierEntity s WHERE s.active = true")
    long countActiveSuppliers();
}
