package com.gmao.gmao_backend.sparepart;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SparePartResponse create(@RequestBody SparePartRequest request) {
        return sparePartService.create(request);
    }

    @PutMapping("/{id}")
    public SparePartResponse update(@PathVariable Long id, @RequestBody SparePartRequest request) {
        return sparePartService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sparePartService.delete(id);
    }
}