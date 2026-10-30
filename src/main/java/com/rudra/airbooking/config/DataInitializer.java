package com.rudra.airbooking.config;

import com.rudra.airbooking.entity.*;
import com.rudra.airbooking.repository.FlightRepository;
import com.rudra.airbooking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
        initializeFlights();
    }

    private void initializeUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    "admin@airbooking.com",
                    passwordEncoder.encode("admin123"),
                    "System Administrator",
                    "+91 9876543210",
                    Role.ROLE_ADMIN
            );
            userRepository.save(admin);
            logger.info("Default Admin account created: admin / admin123");
        }

        if (!userRepository.existsByUsername("john_doe")) {
            User user = new User(
                    "john_doe",
                    "john@example.com",
                    passwordEncoder.encode("password123"),
                    "John Doe",
                    "+91 9123456780",
                    Role.ROLE_USER
            );
            userRepository.save(user);
            logger.info("Sample User account created: john_doe / password123");
        }
    }

    private void initializeFlights() {
        if (flightRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();

            List<Flight> sampleFlights = Arrays.asList(
                    new Flight("AI-202", "Air India", "Delhi", "Mumbai",
                            now.plusDays(1).withHour(6).withMinute(0),
                            now.plusDays(1).withHour(8).withMinute(15),
                            "2h 15m", 4850.0, 180, 172, FlightStatus.SCHEDULED),

                    new Flight("6E-543", "IndiGo", "Delhi", "Mumbai",
                            now.plusDays(1).withHour(11).withMinute(30),
                            now.plusDays(1).withHour(13).withMinute(40),
                            "2h 10m", 4200.0, 186, 150, FlightStatus.SCHEDULED),

                    new Flight("UK-811", "Vistara", "Delhi", "Bengaluru",
                            now.plusDays(1).withHour(9).withMinute(15),
                            now.plusDays(1).withHour(12).withMinute(0),
                            "2h 45m", 5400.0, 164, 140, FlightStatus.SCHEDULED),

                    new Flight("QP-1102", "Akasa Air", "Mumbai", "Bengaluru",
                            now.plusDays(2).withHour(7).withMinute(45),
                            now.plusDays(2).withHour(9).withMinute(30),
                            "1h 45m", 3650.0, 189, 180, FlightStatus.SCHEDULED),

                    new Flight("6E-204", "IndiGo", "Mumbai", "Goa",
                            now.plusDays(2).withHour(14).withMinute(10),
                            now.plusDays(2).withHour(15).withMinute(25),
                            "1h 15m", 2950.0, 180, 165, FlightStatus.SCHEDULED),

                    new Flight("AI-505", "Air India", "Bengaluru", "Delhi",
                            now.plusDays(2).withHour(17).withMinute(30),
                            now.plusDays(2).withHour(20).withMinute(20),
                            "2h 50m", 5100.0, 180, 160, FlightStatus.SCHEDULED),

                    new Flight("UK-920", "Vistara", "Delhi", "Goa",
                            now.plusDays(3).withHour(10).withMinute(0),
                            now.plusDays(3).withHour(12).withMinute(40),
                            "2h 40m", 5800.0, 164, 155, FlightStatus.SCHEDULED),

                    new Flight("6E-711", "IndiGo", "Hyderabad", "Delhi",
                            now.plusDays(3).withHour(8).withMinute(20),
                            now.plusDays(3).withHour(10).withMinute(35),
                            "2h 15m", 4150.0, 180, 175, FlightStatus.SCHEDULED),

                    new Flight("AI-332", "Air India", "Chennai", "Mumbai",
                            now.plusDays(3).withHour(16).withMinute(0),
                            now.plusDays(3).withHour(18).withMinute(0),
                            "2h 00m", 3900.0, 180, 168, FlightStatus.SCHEDULED)
            );

            flightRepository.saveAll(sampleFlights);
            logger.info("Populated {} sample flights.", sampleFlights.size());
        }
    }
}
