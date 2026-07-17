package com.gmao.gmao_backend.maintenanceplan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance-plans")
@RequiredArgsConstructor
public class MaintenancePlanController {

    private final MaintenancePlanService maintenancePlanService;

    @GetMapping
    public ResponseEntity<List<MaintenancePlanResponse>> findAll() {
        return ResponseEntity.ok(maintenancePlanService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenancePlanResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(maintenancePlanService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MaintenancePlanResponse> create(
            @Valid @RequestBody MaintenancePlanRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenancePlanService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenancePlanResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody MaintenancePlanRequest request
    ) {
        return ResponseEntity.ok(maintenancePlanService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        maintenancePlanService.delete(id);
        return ResponseEntity.noContent().build();
    }
}