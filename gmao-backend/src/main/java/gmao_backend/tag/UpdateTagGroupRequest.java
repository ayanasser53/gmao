package com.gmao.gmao_backend.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateTagGroupRequest(

        @NotBlank(message = "Le nom du groupe est obligatoire.")
        @Size(max = 255)
        String name,

        Set<Long> tagIds,

        boolean singleChoice,

        boolean mandatory
) {
}