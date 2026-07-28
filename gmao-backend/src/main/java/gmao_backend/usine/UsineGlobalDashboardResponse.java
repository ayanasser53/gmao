package com.gmao.gmao_backend.usine;

import java.util.List;

public record UsineGlobalDashboardResponse(
        long totalUsines,
        long activeUsines,
        long totalUsers,
        long totalEquipment,
        long totalTasks,
        long totalSpareParts,
        long totalTeams,
        long totalMaintenancePlans,
        List<UsineSummaryStats> perUsine
) {
    public record UsineSummaryStats(
            Long id,
            String name,
            boolean active,
            long userCount,
            long equipmentCount,
            long taskCount
    ) {
    }
}
