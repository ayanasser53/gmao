package com.gmao.gmao_backend.activity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
