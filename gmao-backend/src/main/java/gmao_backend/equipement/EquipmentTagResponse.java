package com.gmao.gmao_backend.equipment;

public record EquipmentTagResponse(
        Long id,
        String name,
        String code,
        String color,
        Long groupId,
        String groupName
) {
}