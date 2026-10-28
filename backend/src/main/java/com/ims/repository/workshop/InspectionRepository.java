package com.ims.repository.workshop;

import com.ims.entity.workshop.InspectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<InspectionEntity, Long>, JpaSpecificationExecutor<InspectionEntity> {
    List<InspectionEntity> findByVehicleId(Long vehicleId);
}
