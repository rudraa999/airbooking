package com.rudra.airbooking.service;

import com.rudra.airbooking.dto.AdminStatsDto;
import com.rudra.airbooking.dto.FlightDto;
import com.rudra.airbooking.entity.BookingStatus;
import com.rudra.airbooking.entity.Flight;
import com.rudra.airbooking.entity.FlightStatus;
import com.rudra.airbooking.repository.BookingRepository;
import com.rudra.airbooking.repository.FlightRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FlightService {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<Flight> getAllFlights() {
        return flightRepository.findByOrderByDepartureTimeAsc();
    }

    public List<Flight> searchFlights(String source, String destination, String date) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (date != null && !date.trim().isEmpty()) {
            try {
                LocalDate localDate = LocalDate.parse(date.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                startDate = localDate.atStartOfDay();
                endDate = localDate.atTime(LocalTime.MAX);
            } catch (Exception e) {
                // If invalid date format, proceed with null dates
            }
        }

        String src = (source != null && !source.trim().isEmpty()) ? source.trim() : null;
        String dest = (destination != null && !destination.trim().isEmpty()) ? destination.trim() : null;

        return flightRepository.searchFlights(src, dest, startDate, endDate, FlightStatus.SCHEDULED);
    }

    public Flight getFlightById(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with id: " + id));
    }

    @Transactional
    public Flight createFlight(FlightDto dto) {
        Flight flight = new Flight();
        populateFlightData(flight, dto);
        if (dto.getAvailableSeats() == null) {
            flight.setAvailableSeats(dto.getTotalSeats());
        } else {
            flight.setAvailableSeats(dto.getAvailableSeats());
        }
        return flightRepository.save(flight);
    }

    @Transactional
    public Flight updateFlight(Long id, FlightDto dto) {
        Flight flight = getFlightById(id);
        populateFlightData(flight, dto);
        if (dto.getAvailableSeats() != null) {
            flight.setAvailableSeats(dto.getAvailableSeats());
        }
        if (dto.getStatus() != null) {
            flight.setStatus(dto.getStatus());
        }
        return flightRepository.save(flight);
    }

    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = getFlightById(id);
        flightRepository.delete(flight);
    }

    public AdminStatsDto getAdminStats() {
        long totalFlights = flightRepository.count();
        long activeFlights = flightRepository.countByStatus(FlightStatus.SCHEDULED);
        long totalBookings = bookingRepository.count();
        long confirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        Double totalRevenue = bookingRepository.calculateTotalRevenue();

        return new AdminStatsDto(
                totalFlights,
                activeFlights,
                totalBookings,
                confirmedBookings,
                totalRevenue != null ? totalRevenue : 0.0
        );
    }

    private void populateFlightData(Flight flight, FlightDto dto) {
        flight.setFlightNumber(dto.getFlightNumber());
        flight.setAirline(dto.getAirline());
        flight.setSourceCity(dto.getSourceCity());
        flight.setDestinationCity(dto.getDestinationCity());
        flight.setDepartureTime(dto.getDepartureTime());
        flight.setArrivalTime(dto.getArrivalTime());
        flight.setPrice(dto.getPrice());
        flight.setTotalSeats(dto.getTotalSeats());

        if (dto.getDuration() != null && !dto.getDuration().trim().isEmpty()) {
            flight.setDuration(dto.getDuration().trim());
        } else if (dto.getDepartureTime() != null && dto.getArrivalTime() != null) {
            Duration dur = Duration.between(dto.getDepartureTime(), dto.getArrivalTime());
            long hours = dur.toHours();
            long mins = dur.toMinutes() % 60;
            flight.setDuration(hours + "h " + mins + "m");
        } else {
            flight.setDuration("2h 00m");
        }

        if (dto.getStatus() != null) {
            flight.setStatus(dto.getStatus());
        }
    }
}
