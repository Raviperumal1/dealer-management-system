package com.ims.repository.service;

import com.ims.entity.service.ServiceRecordEntity;
import com.ims.enums.ServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRecordRepository extends JpaRepository<ServiceRecordEntity, Long>, JpaSpecificationExecutor<ServiceRecordEntity> {
    Optional<ServiceRecordEntity> findByServiceNumber(String serviceNumber);
    List<ServiceRecordEntity> findByCustomerIdOrderByServiceDateDesc(Long customerId);
    List<ServiceRecordEntity> findByVehicleIdOrderByServiceDateDesc(Long vehicleId);

    long countByServiceDate(LocalDate serviceDate);

    @Query("SELECT s FROM ServiceRecordEntity s WHERE s.nextServiceDate = :today")
    List<ServiceRecordEntity> findDueServices(@Param("today") LocalDate today);

    @Query("SELECT s FROM ServiceRecordEntity s WHERE s.nextServiceDate > :today AND s.nextServiceDate <= :upcomingDate")
    List<ServiceRecordEntity> findUpcomingServices(@Param("today") LocalDate today, @Param("upcomingDate") LocalDate upcomingDate);

    @Query("SELECT s FROM ServiceRecordEntity s WHERE s.nextServiceDate < :today")
    List<ServiceRecordEntity> findOverdueServices(@Param("today") LocalDate today);

    @Query("SELECT COUNT(s) FROM ServiceRecordEntity s WHERE s.nextServiceDate = :today")
    long countDueServices(@Param("today") LocalDate today);

    @Query("SELECT COUNT(s) FROM ServiceRecordEntity s WHERE s.nextServiceDate > :today AND s.nextServiceDate <= :upcomingDate")
    long countUpcomingServices(@Param("today") LocalDate today, @Param("upcomingDate") LocalDate upcomingDate);

    @Query("SELECT COUNT(s) FROM ServiceRecordEntity s WHERE s.nextServiceDate < :today")
    long countOverdueServices(@Param("today") LocalDate today);
}
