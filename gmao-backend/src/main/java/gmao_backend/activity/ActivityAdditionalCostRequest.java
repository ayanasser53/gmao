package com.gmao.gmao_backend.activity;

import java.math.BigDecimal;

public record ActivityAdditionalCostRequest(
        String label,
        BigDecimal amount,
        String currency
) {
}