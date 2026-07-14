package com.gmao.gmao_backend.sparepart;

import java.math.BigDecimal;

public record SparePartRequest(
        String name,
        String description,
        String code,
        String manufacturerReference,
        String brand,
        String image,
        BigDecimal unitPrice,
        String currency,
        BigDecimal quantity,
        BigDecimal minimumStock,
        BigDecimal maximumStock,
        BigDecimal reorderQuantity,
        String location,
        Long costCenterId,
        String gtin,
        String articleCode,
        SparePartVisibility visibility,
        Long supplierId
) {
}