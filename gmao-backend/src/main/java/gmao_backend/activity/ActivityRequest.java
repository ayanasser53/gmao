package com.gmao.gmao_backend.activity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ActivityRequest(

        @NotNull
        Long taskId,

        @NotBlank
        String description,

        @NotNull
        LocalDate performedDate,

        @NotNull
        LocalTime performedEndTime,

        int spentHours,

        int spentMinutes,

        ActivityStatus status

) {
}
