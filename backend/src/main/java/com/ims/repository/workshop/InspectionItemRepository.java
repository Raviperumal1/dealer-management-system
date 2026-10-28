package com.ims.repository.workshop;

import com.ims.entity.workshop.InspectionItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionItemRepository extends JpaRepository<InspectionItemEntity, Long> {
    List<InspectionItemEntity> findByInspectionId(Long inspectionId);
}
