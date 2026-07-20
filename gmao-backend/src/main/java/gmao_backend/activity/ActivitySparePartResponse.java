package com.gmao.gmao_backend.activity;

import java.math.BigDecimal;

public record ActivitySparePartResponse(
        Long sparePartId,
        String name,
        String code,
        int quantity,
        BigDecimal unitPrice,
        String currency
) {
}