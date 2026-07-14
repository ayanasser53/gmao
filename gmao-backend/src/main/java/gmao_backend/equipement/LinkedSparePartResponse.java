package com.gmao.gmao_backend.equipment;

import java.math.BigDecimal;

public record LinkedSparePartResponse(
        Long id,
        String code,
        String name,
        String imageUrl,
        BigDecimal quantity
) {
}