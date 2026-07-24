package com.gmao.gmao_backend.supplier;

import com.gmao.gmao_backend.storage.ServedDatabaseFile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> findAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.findById(id));
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<byte[]> getLogo(@PathVariable Long id) {
        ServedDatabaseFile logo = supplierService.getLogo(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(logo.contentType()))
                .body(logo.data());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SupplierResponse> createJson(
            @Valid @RequestBody SupplierRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(supplierService.create(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SupplierResponse> createMultipart(
            @Valid @RequestPart("supplier") SupplierRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(supplierService.create(request, logo));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SupplierResponse> updateJson(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        return ResponseEntity.ok(supplierService.update(id, request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SupplierResponse> updateMultipart(
            @PathVariable Long id,
            @Valid @RequestPart("supplier") SupplierRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo
    ) {
        return ResponseEntity.ok(supplierService.update(id, request, logo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
