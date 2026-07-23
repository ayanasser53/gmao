package com.gmao.gmao_backend.activity;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/activities")
    public ResponseEntity<List<ActivityResponse>> findAll() {
        return ResponseEntity.ok(activityService.findAll());
    }

    @GetMapping("/activities/in-progress")
    public ResponseEntity<List<ActivityResponse>> findInProgress() {
        return ResponseEntity.ok(activityService.findInProgress());
    }

    @GetMapping("/activities/late")
    public ResponseEntity<List<ActivityResponse>> findLate() {
        return ResponseEntity.ok(activityService.findLate());
    }

    @GetMapping("/activities/history")
    public ResponseEntity<List<ActivityResponse>> findHistory() {
        return ResponseEntity.ok(activityService.findHistory());
    }

    @GetMapping("/tasks/{taskId}/activities")
    public ResponseEntity<List<ActivityResponse>> findByTaskId(
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(activityService.findByTaskId(taskId));
    }

    @PostMapping(value = "/activities", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ActivityResponse> create(
            @Valid @RequestBody ActivityRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.create(request));
    }

    @PostMapping(value = "/activities", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ActivityResponse> createWithDocuments(
            @Valid @RequestPart("activity") ActivityRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.create(request, documents));
    }

    @PostMapping(value = "/tasks/{taskId}/activities", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ActivityResponse> createForTask(
            @PathVariable Long taskId,
            @Valid @RequestBody ActivityRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.createForTask(taskId, request));
    }

    @PostMapping(value = "/tasks/{taskId}/activities", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ActivityResponse> createForTaskWithDocuments(
            @PathVariable Long taskId,
            @Valid @RequestPart("activity") ActivityRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.createForTask(taskId, request, documents));
    }

    @PostMapping(value = "/tasks/{taskId}/activities/finish", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ActivityResponse> createForTaskAndFinish(
            @PathVariable Long taskId,
            @Valid @RequestBody ActivityRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.createForTaskAndFinish(taskId, request));
    }

    @PostMapping(value = "/tasks/{taskId}/activities/finish", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ActivityResponse> createForTaskAndFinishWithDocuments(
            @PathVariable Long taskId,
            @Valid @RequestPart("activity") ActivityRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.createForTaskAndFinish(taskId, request, documents));
    }

    @PutMapping(value = "/activities/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ActivityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ActivityRequest request
    ) {
        return ResponseEntity.ok(activityService.update(id, request));
    }

    @PutMapping(value = "/activities/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ActivityResponse> updateWithDocuments(
            @PathVariable Long id,
            @Valid @RequestPart("activity") ActivityRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ResponseEntity.ok(activityService.update(id, request, documents));
    }

    @PatchMapping("/activities/{id}/status")
    public ResponseEntity<ActivityResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam ActivityStatus status
    ) {
        return ResponseEntity.ok(activityService.updateStatus(id, status));
    }

    @DeleteMapping("/activities/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
