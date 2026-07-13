package com.gmao.gmao_backend.costcenter;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cost-centers")
@RequiredArgsConstructor
public class CostCenterController {

    private final CostCenterService costCenterService;

    @GetMapping
    public ResponseEntity<List<CostCenterResponse>> findAll() {
        return ResponseEntity.ok(
                costCenterService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CostCenterResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                costCenterService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<CostCenterResponse> create(
            @Valid @RequestBody CostCenterRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(costCenterService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CostCenterResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CostCenterRequest request
    ) {
        return ResponseEntity.ok(
                costCenterService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        costCenterService.delete(id);

        return ResponseEntity.noContent().build();
    }
}