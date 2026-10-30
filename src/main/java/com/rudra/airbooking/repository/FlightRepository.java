package com.rudra.airbooking.repository;

import com.rudra.airbooking.entity.Flight;
import com.rudra.airbooking.entity.FlightStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    @Query("SELECT f FROM Flight f WHERE " +
           "(:source IS NULL OR LOWER(f.sourceCity) LIKE LOWER(CONCAT('%', :source, '%'))) AND " +
           "(:destination IS NULL OR LOWER(f.destinationCity) LIKE LOWER(CONCAT('%', :destination, '%'))) AND " +
           "(:startDate IS NULL OR f.departureTime >= :startDate) AND " +
           "(:endDate IS NULL OR f.departureTime <= :endDate) AND " +
           "(:status IS NULL OR f.status = :status) " +
           "ORDER BY f.departureTime ASC")
    List<Flight> searchFlights(
            @Param("source") String source,
            @Param("destination") String destination,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("status") FlightStatus status
    );

    List<Flight> findByOrderByDepartureTimeAsc();

    long countByStatus(FlightStatus status);
}
