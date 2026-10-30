package com.rudra.airbooking.controller;

import com.rudra.airbooking.dto.ApiResponse;
import com.rudra.airbooking.dto.BookingRequest;
import com.rudra.airbooking.dto.BookingResponse;
import com.rudra.airbooking.entity.User;
import com.rudra.airbooking.service.AuthService;
import com.rudra.airbooking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AuthService authService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(@Valid @RequestBody BookingRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        BookingResponse booking = bookingService.createBooking(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Flight booked successfully! Your ticket number is " + booking.getTicketNumber(), booking));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<BookingResponse> bookings = bookingService.getBookingsForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.success("User bookings retrieved", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        BookingResponse booking = bookingService.getBookingById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Booking details retrieved", booking));
    }

    @GetMapping("/ticket/{ticketNumber}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByTicketNumber(@PathVariable String ticketNumber) {
        BookingResponse booking = bookingService.getBookingByTicketNumber(ticketNumber);
        return ResponseEntity.ok(ApiResponse.success("Ticket details retrieved", booking));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        BookingResponse booking = bookingService.cancelBooking(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", booking));
    }
}
