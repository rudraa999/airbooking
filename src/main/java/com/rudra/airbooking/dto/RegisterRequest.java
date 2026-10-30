package com.rudra.airbooking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain alphanumeric characters, underscores, hyphens, and dots")
    private String username;

    @NotBlank(message = "Email is required")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Email(message = "Email should be valid")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Please provide a valid email address (e.g. user@example.com)")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.'-]+$", message = "Full name can only contain letters, spaces, hyphens, and apostrophes")
    private String fullName;

    @NotBlank(message = "Mobile number is required")
    @Size(min = 10, max = 20, message = "Mobile number must be between 10 and 20 characters")
    @Pattern(
            regexp = "^(?:(?:\\+?\\d{1,3}[-\\s]?)?[6-9](?:\\d{9}|\\d{4}[-\\s]?\\d{5}|\\d{2}[-\\s]?\\d{3}[-\\s]?\\d{4})|(?:\\+[1-9]\\d{0,3}[-\\s]?\\d{7,12}))$",
            message = "Please enter a valid mobile number (e.g., 9876543210 or +91 9876543210)"
    )
    private String phone;

    public RegisterRequest() {
    }

    public RegisterRequest(String username, String email, String password, String fullName, String phone) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.phone = phone;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
