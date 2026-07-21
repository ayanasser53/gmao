package com.gmao.gmao_backend.activity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record ActivityResponse(
        Long id,
        Long taskId,
        String taskDescription,
        String equipmentName,
        String description,
        LocalDate performedDate,
        LocalTime performedEndTime,
        int spentHours,
        int spentMinutes,
        ActivityStatus status,
        List<ActivitySparePartResponse> spareParts,
        List<ActivityIntervenantResponse> intervenants,
        List<ActivityAdditionalCostResponse> additionalCosts,
        List<ActivityMeasureReadingResponse> measureReadings,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}