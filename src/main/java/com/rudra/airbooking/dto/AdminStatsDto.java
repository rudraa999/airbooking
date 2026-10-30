package com.rudra.airbooking.dto;

public class AdminStatsDto {
    private long totalFlights;
    private long activeFlights;
    private long totalBookings;
    private long confirmedBookings;
    private Double totalRevenue;

    public AdminStatsDto() {
    }

    public AdminStatsDto(long totalFlights, long activeFlights, long totalBookings, long confirmedBookings, Double totalRevenue) {
        this.totalFlights = totalFlights;
        this.activeFlights = activeFlights;
        this.totalBookings = totalBookings;
        this.confirmedBookings = confirmedBookings;
        this.totalRevenue = totalRevenue != null ? totalRevenue : 0.0;
    }

    public long getTotalFlights() {
        return totalFlights;
    }

    public void setTotalFlights(long totalFlights) {
        this.totalFlights = totalFlights;
    }

    public long getActiveFlights() {
        return activeFlights;
    }

    public void setActiveFlights(long activeFlights) {
        this.activeFlights = activeFlights;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getConfirmedBookings() {
        return confirmedBookings;
    }

    public void setConfirmedBookings(long confirmedBookings) {
        this.confirmedBookings = confirmedBookings;
    }

    public Double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(Double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
