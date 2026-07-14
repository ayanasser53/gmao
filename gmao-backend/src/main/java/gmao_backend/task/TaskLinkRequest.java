package com.gmao.gmao_backend.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskLinkRequest(

        @NotBlank(message = "Le nom du lien est obligatoire.")
        @Size(max = 255, message = "Le nom ne doit pas dépasser 255 caractères.")
        String name,

        @NotBlank(message = "L'URL du lien est obligatoire.")
        @Size(max = 500, message = "L'URL ne doit pas dépasser 500 caractères.")
        String url

) {
}
