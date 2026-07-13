package com.gmao.gmao_backend.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTagRequest(

        @NotBlank(message = "Le nom du tag est obligatoire.")
        @Size(
                max = 100,
                message = "Le nom ne doit pas dépasser 100 caractères."
        )
        String name,

        @Size(
                max = 100,
                message = "Le code ne doit pas dépasser 100 caractères."
        )
        String code,

        @Size(
                max = 20,
                message = "La couleur n'est pas valide."
        )
        String color,

        Long groupId
) {
}