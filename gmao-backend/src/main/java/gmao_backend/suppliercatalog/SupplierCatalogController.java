package com.gmao.gmao_backend.suppliercatalog;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.gmao.gmao_backend.storage.ServedDatabaseFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;

@RestController
@RequestMapping("/api/supplier-catalog")
@RequiredArgsConstructor
public class SupplierCatalogController {

    private final SupplierCatalogService supplierCatalogService;

    @GetMapping
    public SupplierCatalogResponse findAll() {
        return supplierCatalogService.findAll();
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierCatalogResponse importItems(
            @Valid @RequestBody SupplierCatalogImportRequest request
    ) {
        return supplierCatalogService.importItems(request);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        supplierCatalogService.delete(id);
    }

    @PostMapping(value = "/items/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SupplierCatalogItemResponse uploadImage(
            @PathVariable Long id,
            @RequestPart("image") MultipartFile image
    ) {
        return supplierCatalogService.uploadImage(id, image);
    }

    @GetMapping("/items/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        ServedDatabaseFile image = supplierCatalogService.getImage(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.data());
    }
}
