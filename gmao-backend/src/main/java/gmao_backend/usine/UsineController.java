package com.gmao.gmao_backend.usine;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestion des usines : réservée au SUPERADMIN.
 */
@RestController
@RequestMapping("/api/usines")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
public class UsineController {

    private final UsineService usineService;

    @GetMapping
    public ResponseEntity<List<UsineResponse>> findAll() {
        return ResponseEntity.ok(usineService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsineResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(usineService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UsineResponse> create(
            @Valid @RequestBody UsineRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usineService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsineResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UsineRequest request
    ) {
        return ResponseEntity.ok(usineService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<UsineResponse> setActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        return ResponseEntity.ok(usineService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
