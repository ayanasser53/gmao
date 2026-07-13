package com.gmao.gmao_backend.sparepart;

import java.math.BigDecimal;

public record SparePartRequest(
        String name,
        String description,
        String code,
        String manufacturerReference,
        String brand,
        String imageUrl,
        BigDecimal unitPrice,
        String currency,
        BigDecimal quantity,
        BigDecimal minimumStock,
        BigDecimal maximumStock,
        BigDecimal reorderQuantity,
        String location,
        String costCenter,
        String gtin,
        String articleCode,
        SparePartVisibility visibility,
        Long supplierId
) {
}