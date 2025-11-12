package com.example.demo.dto;

public class RegisterDto {
    private String name;
    // private String username; // REMOVED
    private String email;
    private String mobileNumber;
    private String password;
    private String confirmPassword;

    // Getters and Setters (username getter/setter removed)
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    // public String getUsername() { return username; } // REMOVED
    // public void setUsername(String username) { this.username = username; } // REMOVED

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}