package com.ims.repository.sales;

import com.ims.entity.sales.BookingEntity;
import com.ims.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long>, JpaSpecificationExecutor<BookingEntity> {
    Optional<BookingEntity> findByBookingNumber(String bookingNumber);
    boolean existsByBookingNumber(String bookingNumber);
    List<BookingEntity> findByVehicleIdAndStatus(Long vehicleId, BookingStatus status);
    List<BookingEntity> findByCustomerId(Long customerId);
}
