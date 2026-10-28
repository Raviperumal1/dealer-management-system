package com.ims.controller.sales;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.sales.BookingCreateRequest;
import com.ims.dtos.sales.BookingResponse;
import com.ims.enums.BookingStatus;
import com.ims.service.serviceInterface.sales.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "Endpoints for vehicle reservations, token advances, and cancellations")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('SALES', 'ADD')")
    @Operation(summary = "Create vehicle booking", description = "Reserves an available vehicle for a customer with advance payment, locking vehicle status to BOOKED")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(@Valid @RequestBody BookingCreateRequest request) {
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Vehicle booking created successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "List bookings", description = "Retrieves paginated list of bookings with filtering by customer, vehicle, or status")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getAllBookings(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<BookingResponse> response = bookingService.getAllBookings(customerId, vehicleId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'VIEW')")
    @Operation(summary = "Get booking by ID", description = "Retrieves details of a vehicle booking")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        BookingResponse response = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permissionService.hasPermission('SALES', 'EDIT')")
    @Operation(summary = "Cancel booking", description = "Cancels active booking and releases vehicle back to AVAILABLE inventory")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Cancelled by customer request") String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        BookingResponse response = bookingService.cancelBooking(id, reason, username);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled and vehicle released to available stock", response));
    }
}
