package com.gmao.gmao_backend.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

public record TaskResponse(

        Long id,

        boolean equipmentOnly,

        TaskEquipmentResponse equipment,

        String description,

        boolean allDay,

        LocalDate startDate,

        LocalTime startHour,

        LocalDate endDate,

        LocalTime endHour,

        int plannedMaintenanceHours,

        int plannedMaintenanceMinutes,

        int plannedStoppedHours,

        int plannedStoppedMinutes,

        TaskStatus status,

        Set<TaskAssigneeResponse> assignees,

        Set<TaskTagResponse> tags,

        Set<TaskSparePartResponse> spareParts,

        Set<TaskDocumentResponse> documents,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
