package com.gmao.gmao_backend.maintenanceplan;

import jakarta.validation.constraints.NotNull;

public record MaintenancePlanStatusRequest(
        @NotNull
        MaintenancePlanStatus status
) {
}
