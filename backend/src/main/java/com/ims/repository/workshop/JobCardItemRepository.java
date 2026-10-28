package com.ims.repository.workshop;

import com.ims.entity.workshop.JobCardItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobCardItemRepository extends JpaRepository<JobCardItemEntity, Long> {
    List<JobCardItemEntity> findByJobCardId(Long jobCardId);
}
