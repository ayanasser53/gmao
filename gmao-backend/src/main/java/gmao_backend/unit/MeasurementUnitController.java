package com.gmao.gmao_backend.unit;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
public class MeasurementUnitController {

    private final MeasurementUnitService unitService;

    @GetMapping
    public ResponseEntity<List<UnitResponse>> findAll() {
        return ResponseEntity.ok(
                unitService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnitResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                unitService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<UnitResponse> create(
            @Valid @RequestBody CreateUnitRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(unitService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnitResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUnitRequest request
    ) {
        return ResponseEntity.ok(
                unitService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        unitService.delete(id);

        return ResponseEntity.noContent().build();
    }
}