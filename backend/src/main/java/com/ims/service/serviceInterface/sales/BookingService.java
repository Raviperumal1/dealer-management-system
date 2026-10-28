package com.ims.service.serviceInterface.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.sales.BookingCreateRequest;
import com.ims.dtos.sales.BookingResponse;
import com.ims.enums.BookingStatus;
import org.springframework.data.domain.Pageable;

public interface BookingService {
    BookingResponse createBooking(BookingCreateRequest request);
    BookingResponse cancelBooking(Long id, String reason, String username);
    BookingResponse getBookingById(Long id);
    PageResponse<BookingResponse> getAllBookings(Long customerId, Long vehicleId, BookingStatus status, Pageable pageable);
}
