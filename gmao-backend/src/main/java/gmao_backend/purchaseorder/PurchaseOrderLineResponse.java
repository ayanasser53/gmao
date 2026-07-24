package com.gmao.gmao_backend.purchaseorder;

import java.math.BigDecimal;

public record PurchaseOrderLineResponse(
        String id,
        PurchaseOrderLineType type,
        Long sparePartId,
        String sparePartName,
        String description,
        BigDecimal quantity,
        BigDecimal unitPrice,
        String currency
) {
}
