package com.ims.service.impl.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.sales.BookingCreateRequest;
import com.ims.dtos.sales.BookingResponse;
import com.ims.entity.sales.BookingEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.BookingStatus;
import com.ims.enums.VehicleStatus;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.sales.BookingRepository;
import com.ims.repository.sales.CustomerRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.serviceInterface.sales.BookingService;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final StatusWorkflowService statusWorkflowService;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingCreateRequest request) {
        CustomerEntity customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        VehicleEntity vehicle = vehicleRepository.findByIdForUpdate(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        if (vehicle.getStatus() == VehicleStatus.BOOKED) {
            throw new BusinessRuleViolationException("Vehicle [" + vehicle.getRegistrationNumber() + "] is already booked by another customer");
        }
        if (vehicle.getStatus() == VehicleStatus.SOLD || vehicle.getStatus() == VehicleStatus.DELIVERED) {
            throw new BusinessRuleViolationException("Vehicle [" + vehicle.getRegistrationNumber() + "] is already sold/delivered");
        }
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE && vehicle.getStatus() != VehicleStatus.READY_FOR_SALE) {
            throw new BusinessRuleViolationException("Vehicle [" + vehicle.getRegistrationNumber() + "] is not currently available for booking (Status: " + vehicle.getStatus() + ")");
        }

        String bookingNumber = "BKG-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BookingEntity booking = BookingEntity.builder()
                .bookingNumber(bookingNumber)
                .customer(customer)
                .vehicle(vehicle)
                .advanceAmount(request.getAdvanceAmount())
                .bookingDate(request.getBookingDate())
                .expiryDate(request.getExpiryDate() != null ? request.getExpiryDate() : request.getBookingDate().plusDays(7))
                .status(BookingStatus.BOOKED)
                .notes(request.getNotes())
                .build();

        BookingEntity savedBooking = bookingRepository.save(booking);

        // Reserve vehicle
        statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.BOOKED, "Vehicle booked under: " + bookingNumber, customer.getName());
        log.info("Booking [{}] created for customer [{}] on vehicle [{}] with advance ₹{}",
                bookingNumber, customer.getName(), vehicle.getRegistrationNumber(), request.getAdvanceAmount());

        return toBookingResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id, String reason, String username) {
        BookingEntity booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new BusinessRuleViolationException("Only active BOOKED reservations can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        if (reason != null && !reason.trim().isEmpty()) {
            booking.setNotes((booking.getNotes() != null ? booking.getNotes() + " | Cancellation Reason: " : "Cancellation Reason: ") + reason);
        }
        BookingEntity saved = bookingRepository.save(booking);

        // Release vehicle back to AVAILABLE
        VehicleEntity vehicle = booking.getVehicle();
        if (vehicle.getStatus() == VehicleStatus.BOOKED) {
            statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.AVAILABLE, "Booking cancelled: " + booking.getBookingNumber() + ". " + reason, username);
        }

        return toBookingResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        BookingEntity booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        return toBookingResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getAllBookings(Long customerId, Long vehicleId, BookingStatus status, Pageable pageable) {
        Specification<BookingEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BookingEntity> page = bookingRepository.findAll(spec, pageable);
        List<BookingResponse> dtos = page.getContent().stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    private BookingResponse toBookingResponse(BookingEntity entity) {
        return BookingResponse.builder()
                .id(entity.getId())
                .bookingNumber(entity.getBookingNumber())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .customerMobile(entity.getCustomer().getMobile())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .vehicleBrand(entity.getVehicle().getBrand())
                .vehicleModel(entity.getVehicle().getModel())
                .advanceAmount(entity.getAdvanceAmount())
                .bookingDate(entity.getBookingDate())
                .expiryDate(entity.getExpiryDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
