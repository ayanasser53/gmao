package com.gmao.gmao_backend.suppliercatalog;

import jakarta.validation.constraints.NotBlank;

public record SupplierCatalogRowRequest(
        @NotBlank String equipment,
        String category,
        String brand,
        String manufacturerReference,
        String gtin,
        String supplierName,
        String supplierLogo,
        String supplierSiren,
        String supplierPhone,
        String supplierDescription,
        String image
) {
}
