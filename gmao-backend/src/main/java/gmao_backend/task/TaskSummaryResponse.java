package com.gmao.gmao_backend.task;

public record TaskSummaryResponse(
        long totalTasks,
        int totalPlannedHours,
        int totalPlannedMinutes
) {
}
