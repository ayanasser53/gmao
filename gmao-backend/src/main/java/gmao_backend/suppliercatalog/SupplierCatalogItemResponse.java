package com.gmao.gmao_backend.suppliercatalog;

public record SupplierCatalogItemResponse(
        Long id,
        String equipment,
        String category,
        String brand,
        String manufacturerReference,
        String gtin,
        Long supplierId,
        String image
) {
}
