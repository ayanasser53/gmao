package com.gmao.gmao_backend.supplier;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> findAll() {
        return ResponseEntity.ok(
                supplierService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                supplierService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(
            @Valid @RequestBody SupplierRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(supplierService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        return ResponseEntity.ok(
                supplierService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        supplierService.delete(id);

        return ResponseEntity.noContent().build();
    }
}