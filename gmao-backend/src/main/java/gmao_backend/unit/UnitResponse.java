package com.gmao.gmao_backend.unit;

import java.time.LocalDateTime;

public record UnitResponse(
        Long id,
        String name,
        String symbol,
        String code,
        UnitType unitType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}