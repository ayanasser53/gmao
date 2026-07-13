package com.gmao.gmao_backend.tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tag-groups")
@RequiredArgsConstructor
public class TagGroupController {

    private final TagGroupService groupService;

    @GetMapping
    public ResponseEntity<List<TagGroupResponse>> findAll() {
        return ResponseEntity.ok(
                groupService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TagGroupResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                groupService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<TagGroupResponse> create(
            @Valid @RequestBody
            CreateTagGroupRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(groupService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagGroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody
            UpdateTagGroupRequest request
    ) {
        return ResponseEntity.ok(
                groupService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        groupService.delete(id);

        return ResponseEntity.noContent().build();
    }
}