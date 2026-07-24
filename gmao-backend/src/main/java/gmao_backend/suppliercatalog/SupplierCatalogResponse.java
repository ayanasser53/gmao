package com.gmao.gmao_backend.suppliercatalog;

import java.util.List;

public record SupplierCatalogResponse(
        List<SupplierCatalogItemResponse> items,
        List<SupplierCatalogSupplierResponse> suppliers
) {
}
