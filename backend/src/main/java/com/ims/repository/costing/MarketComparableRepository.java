package com.ims.repository.costing;

import com.ims.entity.costing.MarketComparableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketComparableRepository extends JpaRepository<MarketComparableEntity, Long>, JpaSpecificationExecutor<MarketComparableEntity> {
    List<MarketComparableEntity> findByVehicleIdOrderByObservationDateDesc(Long vehicleId);
    List<MarketComparableEntity> findByMakeIgnoreCaseAndModelIgnoreCaseOrderByObservationDateDesc(String make, String model);
}
