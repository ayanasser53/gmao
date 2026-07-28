package com.gmao.gmao_backend.usine;

import java.time.LocalDateTime;
import java.util.List;

public record UsineDashboardResponse(
        Long id,
        String name,
        String address,
        String phone,
        String email,
        Boolean active,
        LocalDateTime createdAt,
        UsineStats stats,
        List<UsineAdminSummary> admins
) {
    public record UsineStats(
            long userCount,
            long equipmentCount,
            long taskCount,
            long sparePartCount,
            long teamCount,
            long maintenancePlanCount
    ) {
    }

    public record UsineAdminSummary(
            Long id,
            String firstName,
            String lastName,
            String email,
            boolean active
    ) {
    }
}
