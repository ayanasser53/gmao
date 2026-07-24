package com.gmao.gmao_backend.user;

import java.math.BigDecimal;

public record UserRequest(
        String firstName,
        String lastName,
        String email,
        String phone,
        String password,
        Role role,
        BigDecimal hourlyRate,
        java.util.List<Long> tagIds
) {
}
