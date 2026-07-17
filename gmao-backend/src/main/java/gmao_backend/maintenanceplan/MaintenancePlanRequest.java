package com.gmao.gmao_backend.maintenanceplan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record MaintenancePlanRequest(
        @NotNull
        Long equipmentId,

        @NotBlank
        String description,

        boolean equipmentOnly,

        boolean regulatory,

        @NotNull
        MaintenanceTriggerType triggerType,

        int frequencyValue,

        String frequencyUnit,

        LocalDate startDate,

        LocalDate nextDueDate,

        int plannedMaintenanceHours,

        int plannedMaintenanceMinutes,

        int plannedStoppedHours,

        int plannedStoppedMinutes,

        MaintenancePlanStatus status,

        List<MaintenancePlanSparePartRequest> spareParts
) {
}
