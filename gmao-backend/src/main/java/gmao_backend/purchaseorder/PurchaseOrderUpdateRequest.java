package com.gmao.gmao_backend.purchaseorder;

import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderUpdateRequest(
        String reference,
        Long supplierId,
        String supplierName,
        LocalDate expectedDeliveryDate,
        String notes,
        PurchaseOrderStatus status,
        List<@Valid PurchaseOrderLineRequest> lines
) {
}
