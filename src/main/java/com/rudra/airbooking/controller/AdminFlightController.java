package com.rudra.airbooking.controller;

import com.rudra.airbooking.dto.ApiResponse;
import com.rudra.airbooking.dto.FlightDto;
import com.rudra.airbooking.entity.Flight;
import com.rudra.airbooking.service.FlightService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/flights")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFlightController {

    @Autowired
    private FlightService flightService;

    @PostMapping
    public ResponseEntity<ApiResponse<Flight>> createFlight(@Valid @RequestBody FlightDto flightDto) {
        Flight createdFlight = flightService.createFlight(flightDto);
        return ResponseEntity.ok(ApiResponse.success("Flight added successfully", createdFlight));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Flight>> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightDto flightDto) {
        Flight updatedFlight = flightService.updateFlight(id, flightDto);
        return ResponseEntity.ok(ApiResponse.success("Flight updated successfully", updatedFlight));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        return ResponseEntity.ok(ApiResponse.success("Flight deleted successfully", null));
    }
}
