package com.example.demo.service;

import com.example.demo.dto.RegisterDto;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(RegisterDto registerDto) {
        String encryptedEmail = EncryptionService.encrypt(registerDto.getEmail());
        if (userRepository.findByEmail(encryptedEmail) != null) {
            throw new RuntimeException("Email is already registered");
        }

        User newUser = new User();
        newUser.setName(registerDto.getName());
        newUser.setEmail(registerDto.getEmail());
        newUser.setMobileNumber(registerDto.getMobileNumber());
        newUser.setPassword(passwordEncoder.encode(registerDto.getPassword()));

        return userRepository.save(newUser);
    }
}