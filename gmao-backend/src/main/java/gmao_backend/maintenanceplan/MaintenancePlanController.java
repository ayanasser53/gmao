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
    private final MaintenancePlanTaskGenerationService maintenancePlanTaskGenerationService;

    @GetMapping
    public ResponseEntity<List<MaintenancePlanResponse>> findAll() {
        return ResponseEntity.ok(maintenancePlanService.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<MaintenancePlanResponse>> findMine() {
        return ResponseEntity.ok(maintenancePlanService.findMine());
    }

    @GetMapping("/assigned-to-me")
    public ResponseEntity<List<MaintenancePlanResponse>> findMineAnyUsine() {
        return ResponseEntity.ok(maintenancePlanService.findMineAnyUsine());
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<MaintenancePlanResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody MaintenancePlanStatusRequest request
    ) {
        return ResponseEntity.ok(maintenancePlanService.updateStatus(id, request.status()));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        maintenancePlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Déclenche manuellement la génération des tâches dues (celle qui tourne
     * normalement chaque nuit via le job planifié) — utile pour vérifier le
     * comportement sans attendre minuit.
     */
    @PostMapping("/generate-due-tasks")
    public ResponseEntity<Void> generateDueTasks() {
        maintenancePlanTaskGenerationService.generateDueTasks();
        return ResponseEntity.noContent().build();
    }
}
