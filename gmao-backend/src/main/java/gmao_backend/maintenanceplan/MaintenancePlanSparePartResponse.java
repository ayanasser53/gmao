package com.gmao.gmao_backend.maintenanceplan;

public record MaintenancePlanSparePartResponse(
        Long sparePartId,
        String sparePartName,
        String sparePartCode,
        String sparePartImage,
        int quantity
) {
}
