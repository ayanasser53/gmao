package com.gmao.gmao_backend.sparepart;

import com.gmao.gmao_backend.supplier.Supplier;
import com.gmao.gmao_backend.supplier.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final SupplierRepository supplierRepository;

    public List<SparePartResponse> findAll() {
        return sparePartRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SparePartResponse findById(Long id) {
        SparePart sparePart = getSparePart(id);
        return toResponse(sparePart);
    }

    public SparePartResponse create(SparePartRequest request) {
        validateRequest(request);

        String code = normalizeCode(request.code());

        if (code == null || code.isBlank()) {
            code = generateCode();
        }

        if (sparePartRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code already exists");
        }

        Supplier supplier = getSupplier(request.supplierId());

        SparePart sparePart = SparePart.builder()
                .name(request.name().trim())
                .description(request.description())
                .code(code)
                .manufacturerReference(request.manufacturerReference())
                .brand(request.brand())
                .image(request.image())
                .unitPrice(defaultDecimal(request.unitPrice()))
                .currency(defaultCurrency(request.currency()))
                .quantity(defaultDecimal(request.quantity()))
                .minimumStock(defaultDecimal(request.minimumStock()))
                .maximumStock(defaultDecimal(request.maximumStock()))
                .reorderQuantity(defaultDecimal(request.reorderQuantity()))
                .location(request.location())
                .costCenterId(request.costCenterId())
                .gtin(request.gtin())
                .articleCode(request.articleCode())
                .visibility(defaultVisibility(request.visibility()))
                .supplier(supplier)
                .build();

        return toResponse(sparePartRepository.save(sparePart));
    }

    public SparePartResponse update(Long id, SparePartRequest request) {
        validateRequest(request);

        SparePart sparePart = getSparePart(id);

        String code = normalizeCode(request.code());

        if (code != null && !code.isBlank() && !code.equals(sparePart.getCode())) {
            if (sparePartRepository.existsByCode(code)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Code already exists");
            }
            sparePart.setCode(code);
        }

        Supplier supplier = getSupplier(request.supplierId());

        sparePart.setName(request.name().trim());
        sparePart.setDescription(request.description());
        sparePart.setManufacturerReference(request.manufacturerReference());
        sparePart.setBrand(request.brand());
        sparePart.setImage(request.image());
        sparePart.setUnitPrice(defaultDecimal(request.unitPrice()));
        sparePart.setCurrency(defaultCurrency(request.currency()));
        sparePart.setQuantity(defaultDecimal(request.quantity()));
        sparePart.setMinimumStock(defaultDecimal(request.minimumStock()));
        sparePart.setMaximumStock(defaultDecimal(request.maximumStock()));
        sparePart.setReorderQuantity(defaultDecimal(request.reorderQuantity()));
        sparePart.setLocation(request.location());
        sparePart.setCostCenterId(request.costCenterId());
        sparePart.setGtin(request.gtin());
        sparePart.setArticleCode(request.articleCode());
        sparePart.setVisibility(defaultVisibility(request.visibility()));
        sparePart.setSupplier(supplier);

        return toResponse(sparePart);
    }

    public void delete(Long id) {
        SparePart sparePart = getSparePart(id);
        sparePartRepository.delete(sparePart);
    }

    private SparePart getSparePart(Long id) {
        return sparePartRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spare part not found"));
    }

    private Supplier getSupplier(Long supplierId) {
        if (supplierId == null) {
            return null;
        }

        return supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));
    }

    private void validateRequest(SparePartRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
    }

    private String generateCode() {
        long nextNumber = sparePartRepository.count() + 1;
        String code;

        do {
            code = "MM-%06d".formatted(nextNumber);
            nextNumber++;
        } while (sparePartRepository.existsByCode(code));

        return code;
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return null;
        }

        return code.trim().toUpperCase();
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String defaultCurrency(String currency) {
        return currency == null || currency.isBlank() ? "EUR" : currency.trim().toUpperCase();
    }

    private SparePartVisibility defaultVisibility(SparePartVisibility visibility) {
        return visibility == null ? SparePartVisibility.PRIVATE : visibility;
    }

    private SparePartResponse toResponse(SparePart sparePart) {
        Supplier supplier = sparePart.getSupplier();

        return new SparePartResponse(
                sparePart.getId(),
                sparePart.getName(),
                sparePart.getDescription(),
                sparePart.getCode(),
                sparePart.getManufacturerReference(),
                sparePart.getBrand(),
                sparePart.getImage(),
                sparePart.getUnitPrice(),
                sparePart.getCurrency(),
                sparePart.getQuantity(),
                sparePart.getMinimumStock(),
                sparePart.getMaximumStock(),
                sparePart.getReorderQuantity(),
                sparePart.getLocation(),
                sparePart.getCostCenterId(),
                sparePart.getGtin(),
                sparePart.getArticleCode(),
                sparePart.getVisibility(),
                supplier != null ? supplier.getId() : null,
                supplier != null ? supplier.getName() : null,
                sparePart.getCreatedAt(),
                sparePart.getUpdatedAt()
        );
    }
}