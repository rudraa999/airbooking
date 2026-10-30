package com.rudra.airbooking.service;

import com.rudra.airbooking.dto.AuthRequest;
import com.rudra.airbooking.dto.AuthResponse;
import com.rudra.airbooking.dto.RegisterRequest;
import com.rudra.airbooking.entity.Role;
import com.rudra.airbooking.entity.User;
import com.rudra.airbooking.repository.UserRepository;
import com.rudra.airbooking.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> userRepository.findByEmail(request.getUsername())
                        .orElseThrow(() -> new UsernameNotFoundException("User not found")));

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name()
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanUsername = request.getUsername().trim();
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String cleanPhone = request.getPhone() != null ? request.getPhone().trim() : null;

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (cleanPhone != null && !cleanPhone.isEmpty() && userRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Mobile number is already registered");
        }

        User user = new User(
                cleanUsername,
                cleanEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                cleanPhone,
                Role.ROLE_USER
        );

        User savedUser = userRepository.save(user);

        String jwt = tokenProvider.generateTokenFromUsername(savedUser.getUsername(), savedUser.getRole().name());

        return new AuthResponse(
                jwt,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getPhone(),
                savedUser.getRole().name()
        );
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
