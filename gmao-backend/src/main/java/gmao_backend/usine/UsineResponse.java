package com.gmao.gmao_backend.usine;

import java.time.LocalDateTime;

public record UsineResponse(
        Long id,
        String name,
        String address,
        String phone,
        String email,
        Boolean active,
        Integer userCount,
        LocalDateTime createdAt
) {
}
