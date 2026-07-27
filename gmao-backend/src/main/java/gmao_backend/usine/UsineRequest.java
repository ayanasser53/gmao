package com.gmao.gmao_backend.usine;

import jakarta.validation.constraints.NotBlank;

public record UsineRequest(
        @NotBlank(message = "Le nom de l'usine est obligatoire")
        String name,

        String address,

        String phone,

        String email
) {
}
