package com.gmao.gmao_backend.measure;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateMeasureRequest(

        @NotBlank(message = "Le nom de la mesure est obligatoire.")
        @Size(
                max = 255,
                message = "Le nom ne doit pas dépasser 255 caractères."
        )
        String name,

        @Size(
                max = 100,
                message = "Le code ne doit pas dépasser 100 caractères."
        )
        String code,

        @Size(
                max = 5000,
                message = "La description ne doit pas dépasser 5000 caractères."
        )
        String description,

        @NotNull(message = "L'unité est obligatoire.")
        Long unitId
) {
}