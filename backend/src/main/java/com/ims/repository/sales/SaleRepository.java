package com.ims.repository.sales;

import com.ims.entity.sales.SaleEntity;
import com.ims.enums.SaleStatus;
import com.ims.enums.SaleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<SaleEntity, Long>, JpaSpecificationExecutor<SaleEntity> {

    Optional<SaleEntity> findBySaleNumber(String saleNumber);
    boolean existsBySaleNumber(String saleNumber);
    Optional<SaleEntity> findByVehicleId(Long vehicleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SaleEntity s WHERE s.id = :id")
    Optional<SaleEntity> findByIdForUpdate(@Param("id") Long id);

    List<SaleEntity> findByCustomerId(Long customerId);
    List<SaleEntity> findBySaleDate(LocalDate date);
    List<SaleEntity> findBySaleDateBetween(LocalDate startDate, LocalDate endDate);
    List<SaleEntity> findBySaleType(SaleType saleType);

    long countBySaleDate(LocalDate date);
    long countBySaleDateBetween(LocalDate startDate, LocalDate endDate);
    long countBySaleType(SaleType saleType);
}
