package com.gmao.gmao_backend.maintenanceplan;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MaintenancePlanResponse(
        Long id,
        Long equipmentId,
        String equipmentName,
        String equipmentImage,
        String costCenter,
        String description,
        boolean equipmentOnly,
        boolean regulatory,
        MaintenanceTriggerType triggerType,
        String triggerLabel,
        int frequencyValue,
        String frequencyUnit,
        String frequencyLabel,
        LocalDate startDate,
        LocalDate nextDueDate,
        int plannedMaintenanceHours,
        int plannedMaintenanceMinutes,
        int plannedStoppedHours,
        int plannedStoppedMinutes,
        MaintenancePlanStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}