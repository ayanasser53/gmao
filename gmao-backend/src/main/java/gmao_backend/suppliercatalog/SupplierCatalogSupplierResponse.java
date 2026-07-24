package com.gmao.gmao_backend.suppliercatalog;

public record SupplierCatalogSupplierResponse(
        Long id,
        String name,
        String logo,
        String siren,
        String phone,
        String description,
        boolean official
) {
}
