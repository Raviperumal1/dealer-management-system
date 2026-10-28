package com.ims.repository.workshop;

import com.ims.entity.workshop.JobCardEntity;
import com.ims.enums.JobCardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobCardRepository extends JpaRepository<JobCardEntity, Long>, JpaSpecificationExecutor<JobCardEntity> {
    Optional<JobCardEntity> findByJobCardNumber(String jobCardNumber);
    boolean existsByJobCardNumber(String jobCardNumber);
    List<JobCardEntity> findByVehicleId(Long vehicleId);
    List<JobCardEntity> findByStatus(JobCardStatus status);
    long countByStatus(JobCardStatus status);
}
