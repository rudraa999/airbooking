package com.rudra.airbooking.dto;

import jakarta.validation.constraints.*;

public class BookingRequest {

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger email is required")
    @Email(message = "Passenger email must be valid")
    private String passengerEmail;

    @NotBlank(message = "Passenger phone is required")
    @Size(min = 10, max = 20, message = "Passenger phone must be between 10 and 20 characters")
    @Pattern(
            regexp = "^(?:(?:\\+?\\d{1,3}[-\\s]?)?[6-9](?:\\d{9}|\\d{4}[-\\s]?\\d{5}|\\d{2}[-\\s]?\\d{3}[-\\s]?\\d{4})|(?:\\+[1-9]\\d{0,3}[-\\s]?\\d{7,12}))$",
            message = "Passenger phone must be a valid mobile number (e.g., 9876543210 or +91 9876543210)"
    )
    private String passengerPhone;

    @NotNull(message = "Passenger age is required")
    @Positive(message = "Passenger age must be positive")
    private Integer passengerAge;

    private String seatNumber;

    public BookingRequest() {
    }

    public BookingRequest(Long flightId, String passengerName, String passengerEmail,
                          String passengerPhone, Integer passengerAge, String seatNumber) {
        this.flightId = flightId;
        this.passengerName = passengerName;
        this.passengerEmail = passengerEmail;
        this.passengerPhone = passengerPhone;
        this.passengerAge = passengerAge;
        this.seatNumber = seatNumber;
    }

    public Long getFlightId() {
        return flightId;
    }

    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }

    public String getPassengerName() {
        return passengerName;
    }

    public void setPassengerName(String passengerName) {
        this.passengerName = passengerName;
    }

    public String getPassengerEmail() {
        return passengerEmail;
    }

    public void setPassengerEmail(String passengerEmail) {
        this.passengerEmail = passengerEmail;
    }

    public String getPassengerPhone() {
        return passengerPhone;
    }

    public void setPassengerPhone(String passengerPhone) {
        this.passengerPhone = passengerPhone;
    }

    public Integer getPassengerAge() {
        return passengerAge;
    }

    public void setPassengerAge(Integer passengerAge) {
        this.passengerAge = passengerAge;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }
}
