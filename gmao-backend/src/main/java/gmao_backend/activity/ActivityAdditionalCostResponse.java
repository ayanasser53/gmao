package com.gmao.gmao_backend.activity;

import java.math.BigDecimal;

public record ActivityAdditionalCostResponse(
        Long id,
        String label,
        BigDecimal amount,
        String currency
) {
}