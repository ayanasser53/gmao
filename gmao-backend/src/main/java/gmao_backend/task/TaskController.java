package com.gmao.gmao_backend.task;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskListItemResponse>> findAll() {
        return ResponseEntity.ok(
                taskService.findAll()
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<TaskSummaryResponse> findSummary() {
        return ResponseEntity.ok(
                taskService.findSummary()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                taskService.findById(id)
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TaskResponse> create(
            @RequestPart("task")
            @Valid
            CreateTaskRequest request,

            @RequestPart(value = "documents", required = false)
            List<MultipartFile> documents
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        taskService.create(request, documents)
                );
    }

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<TaskResponse> update(
            @PathVariable Long id,

            @RequestPart("task")
            @Valid
            UpdateTaskRequest request,

            @RequestPart(value = "documents", required = false)
            List<MultipartFile> documents
    ) {
        return ResponseEntity.ok(
                taskService.update(id, request, documents)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable Long id,

            @RequestBody
            @Valid
            UpdateTaskStatusRequest request
    ) {
        return ResponseEntity.ok(
                taskService.updateStatus(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        taskService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
