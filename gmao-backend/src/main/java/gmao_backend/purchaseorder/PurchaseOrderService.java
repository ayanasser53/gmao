package com.gmao.gmao_backend.purchaseorder;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> findAll() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse findById(String id) {
        return toResponse(findOrder(id));
    }

    public PurchaseOrderResponse create(PurchaseOrderRequest request) {
        PurchaseOrder order = PurchaseOrder.builder()
                .reference(trim(request.reference()))
                .supplierId(request.supplierId())
                .supplierName(trim(request.supplierName()))
                .expectedDeliveryDate(request.expectedDeliveryDate())
                .notes(defaultString(request.notes()))
                .status(request.status() != null ? request.status() : PurchaseOrderStatus.DRAFT)
                .build();

        order.replaceLines(toLines(request.lines()));

        return toResponse(purchaseOrderRepository.save(order));
    }

    public PurchaseOrderResponse updateStatus(String id, PurchaseOrderStatusRequest request) {
        PurchaseOrder order = findOrder(id);
        order.setStatus(request.status());

        return toResponse(purchaseOrderRepository.save(order));
    }

    public PurchaseOrderResponse update(String id, PurchaseOrderUpdateRequest request) {
        PurchaseOrder order = findOrder(id);

        if (request.reference() != null) {
            order.setReference(trim(request.reference()));
        }

        if (request.supplierId() != null) {
            order.setSupplierId(request.supplierId());
        }

        if (request.supplierName() != null) {
            order.setSupplierName(trim(request.supplierName()));
        }

        if (request.expectedDeliveryDate() != null) {
            order.setExpectedDeliveryDate(request.expectedDeliveryDate());
        }

        if (request.notes() != null) {
            order.setNotes(defaultString(request.notes()));
        }

        if (request.status() != null) {
            order.setStatus(request.status());
        }

        if (request.lines() != null) {
            order.replaceLines(toLines(request.lines()));
        }

        return toResponse(purchaseOrderRepository.save(order));
    }

    public void delete(String id) {
        Long orderId = parseId(id);

        if (!purchaseOrderRepository.existsById(orderId)) {
            throw new ResourceNotFoundException("Bon de commande introuvable.");
        }

        purchaseOrderRepository.deleteById(orderId);
    }

    private PurchaseOrder findOrder(String id) {
        return purchaseOrderRepository.findById(parseId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bon de commande introuvable."));
    }

    private List<PurchaseOrderLine> toLines(List<PurchaseOrderLineRequest> requests) {
        return requests.stream()
                .map(request -> {
                    PurchaseOrderLine line = PurchaseOrderLine.builder()
                            .type(request.type())
                            .sparePartId(request.sparePartId())
                            .sparePartName(trim(request.sparePartName()))
                            .description(trim(request.description()))
                            .quantity(defaultQuantity(request.quantity()))
                            .unitPrice(defaultNumber(request.unitPrice()))
                            .currency(defaultCurrency(request.currency()))
                            .build();

                    return line;
                })
                .toList();
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        return new PurchaseOrderResponse(
                String.valueOf(order.getId()),
                order.getReference(),
                order.getSupplierId(),
                order.getSupplierName(),
                order.getExpectedDeliveryDate(),
                order.getNotes(),
                order.getStatus(),
                order.getLines()
                        .stream()
                        .map(this::toLineResponse)
                        .toList(),
                order.getCreatedAt(),
                order.getUpdatedAt() != null ? order.getUpdatedAt() : LocalDateTime.now()
        );
    }

    private PurchaseOrderLineResponse toLineResponse(PurchaseOrderLine line) {
        return new PurchaseOrderLineResponse(
                String.valueOf(line.getId()),
                line.getType(),
                line.getSparePartId(),
                line.getSparePartName(),
                line.getDescription(),
                BigDecimal.valueOf(line.getQuantity()),
                line.getUnitPrice(),
                line.getCurrency()
        );
    }

    private Long parseId(String id) {
        try {
            return Long.valueOf(id);
        } catch (NumberFormatException exception) {
            throw new ResourceNotFoundException("Bon de commande introuvable.");
        }
    }

    private Integer defaultQuantity(BigDecimal value) {
        if (value == null) {
            return 1;
        }

        return Math.max(1, value.intValue());
    }

    private BigDecimal defaultNumber(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String defaultCurrency(String currency) {
        String value = trim(currency);
        return value == null ? "EUR" : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private String trim(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
