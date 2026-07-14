package com.gmao.gmao_backend.equipment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateEquipmentRequest(

        @NotBlank(message = "Le nom de l'équipement est obligatoire.")
        @Size(
                max = 255,
                message = "Le nom ne doit pas dépasser 255 caractères."
        )
        String name,

        @Size(
                max = 5000,
                message = "La description ne doit pas dépasser 5000 caractères."
        )
        String description,

        Long costCenterId,

        @Size(
                max = 100,
                message = "Le code GTIN/EAN ne doit pas dépasser 100 caractères."
        )
        String gtinEanCode,

        @Size(
                max = 100,
                message = "Le code article ne doit pas dépasser 100 caractères."
        )
        String itemCode,

        Set<Long> tagIds,

        Set<Long> linkedEquipmentIds,

        Set<Long> linkedSparePartIds

) {
}