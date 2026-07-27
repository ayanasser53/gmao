package com.gmao.gmao_backend.maintenanceplan;

public record MaintenancePlanAssigneeResponse(
        Long id,
        String type,
        Long userId,
        String userFullName,
        String userPhoto,
        Long teamId,
        String teamName
) {
}
