package com.gmao.gmao_backend.sparepart;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SparePartResponse(
        Long id,
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
        Long supplierId,
        String supplierName,
        List<TagResponse> tags,
        List<LinkedEquipmentResponse> linkedEquipments,
        List<LinkedSparePartResponse> linkedSpareParts,
        List<StockMovementResponse> stockMovements,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record LinkedEquipmentResponse(
            Long id,
            String name,
            String description,
            String image
    ) {}

    public record TagResponse(
            Long id,
            String name,
            String code,
            String color
    ) {}

    public record LinkedSparePartResponse(
            Long id,
            String name,
            String code,
            String image
    ) {}

    public record StockMovementResponse(
            Long id,
            String source,
            String reference,
            String taskDescription,
            Long activityId,
            String activityDescription,
            String movementType,
            BigDecimal quantity,
            BigDecimal unitCost,
            String userName,
            LocalDateTime movementDate
    ) {}
}