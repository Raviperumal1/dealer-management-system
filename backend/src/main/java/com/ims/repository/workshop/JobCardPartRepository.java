package com.ims.repository.workshop;

import com.ims.entity.workshop.JobCardPartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobCardPartRepository extends JpaRepository<JobCardPartEntity, Long> {
    List<JobCardPartEntity> findByJobCardId(Long jobCardId);
}
