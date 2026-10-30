package com.rudra.airbooking.service;

import com.rudra.airbooking.dto.BookingRequest;
import com.rudra.airbooking.dto.BookingResponse;
import com.rudra.airbooking.entity.*;
import com.rudra.airbooking.repository.BookingRepository;
import com.rudra.airbooking.repository.FlightRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FlightRepository flightRepository;

    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public BookingResponse createBooking(BookingRequest request, User user) {
        Flight flight = flightRepository.findById(request.getFlightId())
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + request.getFlightId()));

        if (flight.getStatus() != FlightStatus.SCHEDULED) {
            throw new IllegalStateException("Cannot book flight. Flight status is: " + flight.getStatus());
        }

        if (flight.getAvailableSeats() <= 0) {
            throw new IllegalStateException("No seats available on this flight");
        }

        // Decrement available seats atomically in transaction
        flight.setAvailableSeats(flight.getAvailableSeats() - 1);
        flightRepository.save(flight);

        // Generate seat number if empty
        String seatNumber = request.getSeatNumber();
        if (seatNumber == null || seatNumber.trim().isEmpty()) {
            int seatIdx = flight.getTotalSeats() - flight.getAvailableSeats();
            int row = (seatIdx / 6) + 1;
            char col = (char) ('A' + (seatIdx % 6));
            seatNumber = row + String.valueOf(col);
        }

        // Generate unique ticket number
        String ticketNumber = generateTicketNumber();

        Booking booking = new Booking(
                ticketNumber,
                user,
                flight,
                request.getPassengerName().trim(),
                request.getPassengerEmail().trim(),
                request.getPassengerPhone().trim(),
                request.getPassengerAge(),
                seatNumber,
                flight.getPrice(),
                BookingStatus.CONFIRMED
        );

        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    public List<BookingResponse> getBookingsForUser(User user) {
        return bookingRepository.findByUserOrderByBookingDateDesc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByBookingDateDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingByTicketNumber(String ticketNumber) {
        Booking booking = bookingRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ticket number: " + ticketNumber));
        return mapToResponse(booking);
    }

    public BookingResponse getBookingById(Long id, User currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new SecurityException("Access denied: You cannot view this booking");
        }

        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, User currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new SecurityException("Access denied: You cannot cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        // Restore seat back to flight
        Flight flight = booking.getFlight();
        if (flight != null && flight.getAvailableSeats() < flight.getTotalSeats()) {
            flight.setAvailableSeats(flight.getAvailableSeats() + 1);
            flightRepository.save(flight);
        }

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    private String generateTicketNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        int rand = 1000 + random.nextInt(9000);
        return "TKT-" + datePart + "-" + rand;
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse res = new BookingResponse();
        res.setId(booking.getId());
        res.setTicketNumber(booking.getTicketNumber());
        res.setPassengerName(booking.getPassengerName());
        res.setPassengerEmail(booking.getPassengerEmail());
        res.setPassengerPhone(booking.getPassengerPhone());
        res.setPassengerAge(booking.getPassengerAge());
        res.setSeatNumber(booking.getSeatNumber());
        res.setTotalAmount(booking.getTotalAmount());
        res.setStatus(booking.getStatus());
        res.setBookingDate(booking.getBookingDate());

        if (booking.getUser() != null) {
            res.setBookedByUsername(booking.getUser().getUsername());
        }

        Flight flight = booking.getFlight();
        if (flight != null) {
            res.setFlightId(flight.getId());
            res.setFlightNumber(flight.getFlightNumber());
            res.setAirline(flight.getAirline());
            res.setSourceCity(flight.getSourceCity());
            res.setDestinationCity(flight.getDestinationCity());
            res.setDepartureTime(flight.getDepartureTime());
            res.setArrivalTime(flight.getArrivalTime());
            res.setDuration(flight.getDuration());
        }

        return res;
    }
}
