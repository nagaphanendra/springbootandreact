package com.example.demo.entity;

import com.example.demo.service.EncryptionService;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- PERSISTENT FIELDS (stored in DB, encrypted) ---
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "password", nullable = false)
    private String password;

    // --- TRANSIENT FIELDS (held in memory, decrypted) ---
    @Transient
    private String decryptedName;
    @Transient
    private String decryptedEmail;
    @Transient
    private String decryptedMobileNumber;

    // --- JPA LIFECYCLE CALLBACKS (THE FIX IS HERE) ---
    @PrePersist
    @PreUpdate
    public void encryptFields() {
        // Before saving, encrypt the transient fields and put them into the persistent fields
        System.out.println(">>> PrePersist/PreUpdate: Encrypting fields...");
        this.name = EncryptionService.encrypt(this.decryptedName);
        this.email = EncryptionService.encrypt(this.decryptedEmail);
        this.mobileNumber = EncryptionService.encrypt(this.decryptedMobileNumber);
        System.out.println(">>> PrePersist/PreUpdate: Encryption complete.");
    }

    @PostLoad
    public void decryptFields() {
        // After loading from DB, decrypt the persistent fields and put them into the transient fields
        System.out.println(">>> PostLoad: Decrypting fields...");
        this.decryptedName = EncryptionService.decrypt(this.name);
        this.decryptedEmail = EncryptionService.decrypt(this.email);
        this.decryptedMobileNumber = EncryptionService.decrypt(this.mobileNumber);
        System.out.println(">>> PostLoad: Decryption complete.");
    }

    // --- GETTERS AND SETTERS (must use transient fields) ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return decryptedName; }
    public void setName(String name) { this.decryptedName = name; }

    public String getEmail() { return decryptedEmail; }
    public void setEmail(String email) { this.decryptedEmail = email; }

    public String getMobileNumber() { return decryptedMobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.decryptedMobileNumber = mobileNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    // --- UserDetails Implementation ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getUsername() {
        // Spring Security needs the decrypted email for authentication
        return getEmail();
    }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}