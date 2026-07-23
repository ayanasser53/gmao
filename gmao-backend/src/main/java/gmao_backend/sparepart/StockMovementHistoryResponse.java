package com.gmao.gmao_backend.sparepart;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockMovementHistoryResponse(
        Long id,
        Long sparePartId,
        String sparePartName,
        String sparePartImage,
        Long taskId,
        String taskDescription,
        Long activityId,
        String activityDescription,
        String source,
        String movementType,
        BigDecimal quantity,
        BigDecimal unitCost,
        String userName,
        LocalDateTime movementDate
) {
}
