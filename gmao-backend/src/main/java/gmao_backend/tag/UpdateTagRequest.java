package com.gmao.gmao_backend.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTagRequest(

        @NotBlank(message = "Le nom du tag est obligatoire.")
        @Size(max = 100)
        String name,

        @NotBlank(message = "Le code est obligatoire.")
        @Size(max = 100)
        String code,

        @Size(max = 20)
        String color,

        Long groupId
) {
}