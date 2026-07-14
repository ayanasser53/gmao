package com.gmao.gmao_backend.equipment;

public record LinkedEquipmentResponse(
        Long id,
        String name,
        String image,
        String itemCode
) {
}