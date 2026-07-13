package com.gmao.gmao_backend.tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> findAll() {
        return ResponseEntity.ok(tagService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TagResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                tagService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<TagResponse> create(
            @Valid @RequestBody CreateTagRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(tagService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTagRequest request
    ) {
        return ResponseEntity.ok(
                tagService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        tagService.delete(id);

        return ResponseEntity.noContent().build();
    }
}