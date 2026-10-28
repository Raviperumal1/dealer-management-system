package com.ims.repository.service;

import com.ims.entity.service.ServicePartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePartRepository extends JpaRepository<ServicePartEntity, Long> {
    List<ServicePartEntity> findByServiceRecordId(Long serviceRecordId);
}
