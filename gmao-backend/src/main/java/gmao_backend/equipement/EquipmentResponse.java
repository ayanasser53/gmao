package com.gmao.gmao_backend.equipment;

import java.time.LocalDateTime;
import java.util.Set;

public record EquipmentResponse(

        Long id,

        String image,

        String name,

        String description,

        Long costCenterId,

        String costCenterName,

        String gtinEanCode,

        String itemCode,

        Set<EquipmentTagResponse> tags,

        Set<LinkedEquipmentResponse> linkedEquipment,

        Set<LinkedSparePartResponse> linkedSpareParts,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}