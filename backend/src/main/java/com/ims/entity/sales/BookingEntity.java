package com.ims.entity.sales;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "bookings")
public class BookingEntity extends BaseEntity {

    @Column(name = "booking_number", nullable = false, unique = true, length = 50)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "advance_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal advanceAmount;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.BOOKED; // BOOKED, CANCELLED, CONVERTED_TO_SALE

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
