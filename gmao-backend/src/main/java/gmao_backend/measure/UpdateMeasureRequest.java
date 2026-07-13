package com.gmao.gmao_backend.measure;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateMeasureRequest(

        @NotBlank(message = "Le nom de la mesure est obligatoire.")
        @Size(max = 255)
        String name,

        @NotBlank(message = "Le code est obligatoire.")
        @Size(max = 100)
        String code,

        @Size(max = 5000)
        String description,

        @NotNull(message = "L'unité est obligatoire.")
        Long unitId
) {
}