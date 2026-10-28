package com.ims.repository.vehicle;

import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<VehicleEntity, Long>, JpaSpecificationExecutor<VehicleEntity> {

    Optional<VehicleEntity> findByRegistrationNumber(String registrationNumber);
    boolean existsByRegistrationNumber(String registrationNumber);
    boolean existsByChassisNumber(String chassisNumber);
    boolean existsByEngineNumber(String engineNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VehicleEntity v WHERE v.id = :id")
    Optional<VehicleEntity> findByIdForUpdate(@Param("id") Long id);

    List<VehicleEntity> findByStatus(VehicleStatus status);

    List<VehicleEntity> findByOwnershipType(OwnershipType ownershipType);

    long countByOwnershipType(OwnershipType ownershipType);

    long countByOwnershipTypeAndStatus(OwnershipType ownershipType, VehicleStatus status);

    long countByVehicleTypeAndStatus(VehicleType vehicleType, VehicleStatus status);

    long countByStatus(VehicleStatus status);
}
