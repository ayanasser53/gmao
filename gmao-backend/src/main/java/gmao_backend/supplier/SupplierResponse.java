package com.gmao.gmao_backend.supplier;

import java.time.LocalDateTime;

public record SupplierResponse(
        Long id,
        String name,
        String description,
        String email,
        String website,
        String sirenOrSiret,
        String reference,
        String phone,
        String fax,
        String address,
        String postalCode,
        String city,
        String country,
        SupplierVisibility visibility,
        String logoUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}