package com.example.demo.controller;

import com.example.demo.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping
    public Map<String, Object> getDashboardData(@AuthenticationPrincipal User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Welcome to your dashboard, " + user.getName() + "!");
        data.put("accountBalance", "$12,345.67");
        data.put("accountNumber", "123456789");
        // In a real app, you would fetch transactions from a database
        data.put("recentTransactions", new String[]{
            "Deposit: +$500.00",
            "Withdrawal: -$50.00",
            "Online Payment: -$25.99"
        });
        return data;
    }
}