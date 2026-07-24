package com.gmao.gmao_backend.purchaseorder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record PurchaseOrderLineRequest(
        String id,
        @NotNull PurchaseOrderLineType type,
        Long sparePartId,
        String sparePartName,
        @NotBlank String description,
        @NotNull @Positive BigDecimal quantity,
        @NotNull @PositiveOrZero BigDecimal unitPrice,
        String currency
) {
}
