package com.gmao.gmao_backend.sparepart;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/spare-parts")
@RequiredArgsConstructor
public class SparePartController {

    private final SparePartService sparePartService;

    @GetMapping
    public List<SparePartResponse> findAll() {
        return sparePartService.findAll();
    }

    @GetMapping("/{id}")
    public SparePartResponse findById(@PathVariable Long id) {
        return sparePartService.findById(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SparePartResponse createJson(@RequestBody SparePartRequest request) {
        return sparePartService.create(request);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SparePartResponse createMultipart(
            @RequestPart("sparePart") SparePartRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return sparePartService.create(request, image);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public SparePartResponse updateJson(
            @PathVariable Long id,
            @RequestBody SparePartRequest request
    ) {
        return sparePartService.update(id, request);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SparePartResponse updateMultipart(
            @PathVariable Long id,
            @RequestPart("sparePart") SparePartRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return sparePartService.update(id, request, image);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sparePartService.delete(id);
    }
}