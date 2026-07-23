package com.gmao.gmao_backend.sparepart;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
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

    @GetMapping("/{id}/external-stock-check")
    public ExternalStockCheckResponse checkExternalStock(@PathVariable Long id) {
        return sparePartService.checkExternalStock(id);
    }

    @GetMapping("/external-stock-check-all")
    public List<ExternalStockCheckResponse> checkExternalStockForAll() {
        return sparePartService.checkExternalStockForAll();
    }

    @GetMapping("/stock-movements")
    public List<StockMovementHistoryResponse> searchMovementHistory(
            @RequestParam(required = false) Long sparePartId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long activityId,
            @RequestParam(required = false) String userName
    ) {
        return sparePartService.searchMovementHistory(
                sparePartId,
                startDate != null ? startDate.atStartOfDay() : null,
                endDate != null ? endDate.atTime(23, 59, 59) : null,
                taskId,
                activityId,
                userName
        );
    }

    @PostMapping("/{id}/reconcile-stock")
    public SparePartResponse reconcileStock(
            @PathVariable Long id,
            @RequestParam BigDecimal externalQuantity
    ) {
        return sparePartService.reconcileStock(id, externalQuantity);
    }
}