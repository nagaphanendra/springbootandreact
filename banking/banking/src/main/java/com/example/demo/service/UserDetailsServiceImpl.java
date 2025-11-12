package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Encrypt the email to search in the database using the static method
        String encryptedEmail = EncryptionService.encrypt(email);
        User user = userRepository.findByEmail(encryptedEmail);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        return user;
    }
}