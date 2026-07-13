package com.gmao.gmao_backend.measure;

import com.gmao.gmao_backend.unit.UnitType;

import java.time.LocalDateTime;

public record MeasureResponse(
        Long id,
        String name,
        String code,
        String description,

        Long unitId,
        String unitName,
        String unitSymbol,
        UnitType unitType,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}