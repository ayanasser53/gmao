package com.gmao.gmao_backend.task;

import java.time.LocalDate;
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

        TaskEquipmentResponse equipment,

        Long costCenterId,

        String costCenterName,

        Set<TaskAssigneeResponse> assignees,

        Set<TaskAssigneeResponse> assignedTo,

        Set<TaskTagResponse> tags,

        TaskStatus status

) {
}
