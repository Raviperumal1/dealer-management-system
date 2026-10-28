package com.ims.repository.service;

import com.ims.entity.service.ServiceFollowUpEntity;
import com.ims.enums.FollowUpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceFollowUpRepository extends JpaRepository<ServiceFollowUpEntity, Long>, JpaSpecificationExecutor<ServiceFollowUpEntity> {
    List<ServiceFollowUpEntity> findByCustomerIdOrderByFollowUpDateDesc(Long customerId);
    List<ServiceFollowUpEntity> findByVehicleIdOrderByFollowUpDateDesc(Long vehicleId);
    List<ServiceFollowUpEntity> findByStatus(FollowUpStatus status);
    List<ServiceFollowUpEntity> findByStatusAndFollowUpDateLessThanEqual(FollowUpStatus status, LocalDate date);
    long countByStatus(FollowUpStatus status);
}
