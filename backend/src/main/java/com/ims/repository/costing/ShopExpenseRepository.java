package com.ims.repository.costing;

import com.ims.entity.costing.ShopExpenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShopExpenseRepository extends JpaRepository<ShopExpenseEntity, Long>, JpaSpecificationExecutor<ShopExpenseEntity> {
    List<ShopExpenseEntity> findByVehicleId(Long vehicleId);
    List<ShopExpenseEntity> findByBrokerId(Long brokerId);
    List<ShopExpenseEntity> findByExpenseDateBetween(LocalDate startDate, LocalDate endDate);
}
