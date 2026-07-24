package com.gmao.gmao_backend.purchaseorder;

import jakarta.validation.constraints.NotNull;

public record PurchaseOrderStatusRequest(
        @NotNull PurchaseOrderStatus status
) {
}
