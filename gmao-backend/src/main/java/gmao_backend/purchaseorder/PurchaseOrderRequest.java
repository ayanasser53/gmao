package com.gmao.gmao_backend.purchaseorder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderRequest(
        String id,
        @NotBlank String reference,
        Long supplierId,
        String supplierName,
        LocalDate expectedDeliveryDate,
        String notes,
        PurchaseOrderStatus status,
        @NotEmpty List<@Valid PurchaseOrderLineRequest> lines
) {
}
