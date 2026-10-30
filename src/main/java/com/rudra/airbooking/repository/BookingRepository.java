package com.rudra.airbooking.repository;

import com.rudra.airbooking.entity.Booking;
import com.rudra.airbooking.entity.BookingStatus;
import com.rudra.airbooking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserOrderByBookingDateDesc(User user);
    Optional<Booking> findByTicketNumber(String ticketNumber);
    List<Booking> findAllByOrderByBookingDateDesc();
    long countByStatus(BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0.0) FROM Booking b WHERE b.status = 'CONFIRMED'")
    Double calculateTotalRevenue();
}
