package com.gmao.gmao_backend.supplier;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank
        @Size(max = 255)
        String name,

        String description,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @Size(max = 255)
        String website,

        @Size(max = 50)
        String sirenOrSiret,

        @Size(max = 100)
        String reference,

        @Size(max = 50)
        String phone,

        @Size(max = 50)
        String fax,

        @Size(max = 255)
        String address,

        @Size(max = 30)
        String postalCode,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String country,

        SupplierVisibility visibility,

        @Size(max = 500)
        String logoUrl
) {
}