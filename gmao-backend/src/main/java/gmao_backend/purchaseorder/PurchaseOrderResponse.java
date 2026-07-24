package com.gmao.gmao_backend.purchaseorder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponse(
        String id,
        String reference,
        Long supplierId,
        String supplierName,
        LocalDate expectedDeliveryDate,
        String notes,
        PurchaseOrderStatus status,
        List<PurchaseOrderLineResponse> lines,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
