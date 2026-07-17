package com.gmao.gmao_backend.maintenanceplan;

public record MaintenancePlanSparePartRequest(
        Long sparePartId,
        int quantity
) {
}
