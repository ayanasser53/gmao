package com.gmao.gmao_backend.measure;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/measures")
@RequiredArgsConstructor
public class MeasureController {

    private final MeasureService measureService;

    @GetMapping
    public ResponseEntity<List<MeasureResponse>> findAll() {
        return ResponseEntity.ok(
                measureService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeasureResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                measureService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<MeasureResponse> create(
            @Valid @RequestBody CreateMeasureRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(measureService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeasureResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMeasureRequest request
    ) {
        return ResponseEntity.ok(
                measureService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        measureService.delete(id);

        return ResponseEntity.noContent().build();
    }
}