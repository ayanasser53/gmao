package com.gmao.gmao_backend.purchaseorder;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public List<PurchaseOrderResponse> findAll() {
        return purchaseOrderService.findAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse findById(@PathVariable String id) {
        return purchaseOrderService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrderResponse create(@Valid @RequestBody PurchaseOrderRequest request) {
        return purchaseOrderService.create(request);
    }

    @PatchMapping("/{id}/status")
    public PurchaseOrderResponse updateStatus(
            @PathVariable String id,
            @Valid @RequestBody PurchaseOrderStatusRequest request
    ) {
        return purchaseOrderService.updateStatus(id, request);
    }

    @PutMapping("/{id}")
    public PurchaseOrderResponse update(
            @PathVariable String id,
            @Valid @RequestBody PurchaseOrderUpdateRequest request
    ) {
        return purchaseOrderService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        purchaseOrderService.delete(id);
    }
}
