package com.rudra.airbooking.controller;

import com.rudra.airbooking.dto.AdminStatsDto;
import com.rudra.airbooking.dto.ApiResponse;
import com.rudra.airbooking.dto.BookingResponse;
import com.rudra.airbooking.entity.User;
import com.rudra.airbooking.service.AuthService;
import com.rudra.airbooking.service.BookingService;
import com.rudra.airbooking.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private FlightService flightService;

    @Autowired
    private AuthService authService;

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(ApiResponse.success("All bookings retrieved", bookings));
    }

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long id) {
        User adminUser = authService.getCurrentAuthenticatedUser();
        BookingResponse booking = bookingService.cancelBooking(id, adminUser);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled by admin", booking));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getStats() {
        AdminStatsDto stats = flightService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics", stats));
    }
}
