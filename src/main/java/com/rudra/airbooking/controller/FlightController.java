package com.rudra.airbooking.controller;

import com.rudra.airbooking.dto.ApiResponse;
import com.rudra.airbooking.entity.Flight;
import com.rudra.airbooking.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    @Autowired
    private FlightService flightService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Flight>>> searchFlights(
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String date) {

        List<Flight> flights;
        if ((source != null && !source.trim().isEmpty()) ||
            (destination != null && !destination.trim().isEmpty()) ||
            (date != null && !date.trim().isEmpty())) {
            flights = flightService.searchFlights(source, destination, date);
        } else {
            flights = flightService.getAllFlights();
        }

        return ResponseEntity.ok(ApiResponse.success("Flights retrieved successfully", flights));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Flight>> getFlightById(@PathVariable Long id) {
        Flight flight = flightService.getFlightById(id);
        return ResponseEntity.ok(ApiResponse.success("Flight details retrieved", flight));
    }
}
