package com.gmao.gmao_backend.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

public record TaskListItemResponse(

        Long id,

        String description,

        LocalDate startDate,

        LocalTime startHour,

        LocalDate endDate,

        LocalTime endHour,

        int plannedMaintenanceHours,

        int plannedMaintenanceMinutes,

        int plannedStoppedHours,

        int plannedStoppedMinutes,

        TaskEquipmentResponse equipment,

        Long costCenterId,

        String costCenterName,

        Long maintenancePlanId,

        Set<TaskAssigneeResponse> assignees,

        Set<TaskAssigneeResponse> assignedTo,

        Set<TaskTagResponse> tags,

        TaskStatus status,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
