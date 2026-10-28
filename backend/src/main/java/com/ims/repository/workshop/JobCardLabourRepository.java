package com.ims.repository.workshop;

import com.ims.entity.workshop.JobCardLabourEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobCardLabourRepository extends JpaRepository<JobCardLabourEntity, Long> {
    List<JobCardLabourEntity> findByJobCardId(Long jobCardId);
}
