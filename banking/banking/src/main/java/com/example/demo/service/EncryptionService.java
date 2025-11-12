package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Service
public class EncryptionService {

    @Value("${aes.encryption.key}")
    private String encryptionKey;

    private static SecretKeySpec secretKey;

    @PostConstruct
    public void init() {
        if (encryptionKey == null || encryptionKey.length() != 16) {
            throw new IllegalStateException("AES encryption key is not set or is not 16 characters long!");
        }
        secretKey = new SecretKeySpec(encryptionKey.getBytes(), "AES");
        System.out.println(">>> EncryptionService initialized successfully.");
    }

    private static final String ALGORITHM = "AES";

    public static String encrypt(String data) {
        if (data == null) return null;
        if (secretKey == null) {
            throw new RuntimeException("Encryption key is not initialized. Cannot encrypt.");
        }
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting data: " + e.getMessage(), e);
        }
    }

    public static String decrypt(String encryptedData) {
        if (encryptedData == null) return null;
        if (secretKey == null) {
            throw new RuntimeException("Encryption key is not initialized. Cannot decrypt.");
        }
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedData);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            return new String(decryptedBytes);
        } catch (Exception e) {
            // If decryption fails, return as is. This handles non-encrypted legacy data.
            return encryptedData;
        }
    }
}