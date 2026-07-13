package com.gmao.gmao_backend.unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUnitRequest(

        @NotBlank(message = "Le nom de l'unité est obligatoire.")
        @Size(max = 255)
        String name,

        @NotBlank(message = "Le symbole est obligatoire.")
        @Size(max = 20)
        String symbol,

        @NotBlank(message = "Le code est obligatoire.")
        @Size(max = 100)
        String code,

        @NotNull(message = "Le type de l'unité est obligatoire.")
        UnitType unitType
) {
}