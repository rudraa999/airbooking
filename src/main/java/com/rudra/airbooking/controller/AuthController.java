package com.rudra.airbooking.controller;

import com.rudra.airbooking.dto.ApiResponse;
import com.rudra.airbooking.dto.AuthRequest;
import com.rudra.airbooking.dto.AuthResponse;
import com.rudra.airbooking.dto.RegisterRequest;
import com.rudra.airbooking.entity.User;
import com.rudra.airbooking.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser() {
        User user = authService.getCurrentAuthenticatedUser();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("fullName", user.getFullName());
        userData.put("phone", user.getPhone());
        userData.put("role", user.getRole().name());

        return ResponseEntity.ok(ApiResponse.success("Current user profile", userData));
    }
}
