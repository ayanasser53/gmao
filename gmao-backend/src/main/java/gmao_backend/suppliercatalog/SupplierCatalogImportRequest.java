package com.gmao.gmao_backend.suppliercatalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SupplierCatalogImportRequest(
        @NotEmpty List<@Valid SupplierCatalogRowRequest> items
) {
}
