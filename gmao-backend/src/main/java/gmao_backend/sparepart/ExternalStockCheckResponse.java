package com.gmao.gmao_backend.sparepart;

import java.math.BigDecimal;

public record ExternalStockCheckResponse(
        Long sparePartId,
        String sparePartName,
        BigDecimal appQuantity,
        BigDecimal externalQuantity,
        boolean inSync,
        String checkedAt
) {
}