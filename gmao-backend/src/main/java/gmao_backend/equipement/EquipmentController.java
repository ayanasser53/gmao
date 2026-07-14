package com.gmao.gmao_backend.equipment;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<List<EquipmentResponse>> findAll() {
        return ResponseEntity.ok(
                equipmentService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                equipmentService.findById(id)
        );
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<EquipmentResponse> create(
            @RequestPart("equipment")
            @Valid
            CreateEquipmentRequest request,

            @RequestPart(
                    value = "image",
                    required = false
            )
            MultipartFile image
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        equipmentService.create(
                                request,
                                image
                        )
                );
    }

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<EquipmentResponse> update(
            @PathVariable Long id,

            @RequestPart("equipment")
            @Valid
            UpdateEquipmentRequest request,

            @RequestPart(
                    value = "image",
                    required = false
            )
            MultipartFile image
    ) {
        return ResponseEntity.ok(
                equipmentService.update(
                        id,
                        request,
                        image
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        equipmentService.delete(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}