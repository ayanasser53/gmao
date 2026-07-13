package com.gmao.gmao_backend.unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUnitRequest(

        @NotBlank(message = "Le nom de l'unité est obligatoire.")
        @Size(
                max = 255,
                message = "Le nom ne doit pas dépasser 255 caractères."
        )
        String name,

        @NotBlank(message = "Le symbole est obligatoire.")
        @Size(
                max = 20,
                message = "Le symbole ne doit pas dépasser 20 caractères."
        )
        String symbol,

        @Size(
                max = 100,
                message = "Le code ne doit pas dépasser 100 caractères."
        )
        String code,

        @NotNull(message = "Le type de l'unité est obligatoire.")
        UnitType unitType
) {
}