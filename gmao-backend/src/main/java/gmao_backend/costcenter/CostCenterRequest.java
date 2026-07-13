package com.gmao.gmao_backend.costcenter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CostCenterRequest(

        @NotBlank(message = "Le nom du centre de coût est obligatoire.")
        @Size(
                max = 255,
                message = "Le nom ne doit pas dépasser 255 caractères."
        )
        String name
) {
}