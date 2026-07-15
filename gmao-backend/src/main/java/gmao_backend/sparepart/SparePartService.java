package com.gmao.gmao_backend.sparepart;

import com.gmao.gmao_backend.costcenter.CostCenterRepository;
import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.storage.AppFileStorageService;
import com.gmao.gmao_backend.supplier.Supplier;
import com.gmao.gmao_backend.supplier.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final SupplierRepository supplierRepository;
    private final CostCenterRepository costCenterRepository;
    private final AppFileStorageService fileStorageService;
    private final EquipmentRepository equipmentRepository;
    private final SparePartStockMovementRepository stockMovementRepository;

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
        return create(request, null);
    }

    public SparePartResponse create(SparePartRequest request, MultipartFile image) {
        validateRequest(request);

        String code = normalizeCode(request.code());

        if (code == null || code.isBlank()) {
            code = generateCode();
        }

        if (sparePartRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code already exists");
        }

        Supplier supplier = getSupplier(request.supplierId());
        Long costCenterId = resolveCostCenterId(request.costCenterId());

        SparePart sparePart = SparePart.builder()
                .name(request.name().trim())
                .description(request.description())
                .code(code)
                .manufacturerReference(request.manufacturerReference())
                .brand(request.brand())
                .image(resolveImage(request.image(), image, null))
                .unitPrice(defaultDecimal(request.unitPrice()))
                .currency(defaultCurrency(request.currency()))
                .quantity(defaultDecimal(request.quantity()))
                .minimumStock(defaultDecimal(request.minimumStock()))
                .maximumStock(defaultDecimal(request.maximumStock()))
                .reorderQuantity(defaultDecimal(request.reorderQuantity()))
                .location(request.location())
                .costCenterId(costCenterId)
                .gtin(request.gtin())
                .articleCode(request.articleCode())
                .visibility(defaultVisibility(request.visibility()))
                .supplier(supplier)
                .linkedSpareParts(resolveLinkedSpareParts(request.linkedSparePartIds(), null))
                .build();

        SparePart savedSparePart = sparePartRepository.save(sparePart);
        syncLinkedEquipment(savedSparePart, request.linkedEquipmentIds());
        SparePart refreshedSparePart = sparePartRepository.save(savedSparePart);

        return toResponse(refreshedSparePart);
    }

    public SparePartResponse update(Long id, SparePartRequest request) {
        return update(id, request, null);
    }

    public SparePartResponse update(Long id, SparePartRequest request, MultipartFile image) {
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
        Long costCenterId = resolveCostCenterId(request.costCenterId());

        sparePart.setName(request.name().trim());
        sparePart.setDescription(request.description());
        sparePart.setManufacturerReference(request.manufacturerReference());
        sparePart.setBrand(request.brand());
        sparePart.setImage(resolveImage(request.image(), image, sparePart.getImage()));
        sparePart.setUnitPrice(defaultDecimal(request.unitPrice()));
        sparePart.setCurrency(defaultCurrency(request.currency()));
        sparePart.setQuantity(defaultDecimal(request.quantity()));
        sparePart.setMinimumStock(defaultDecimal(request.minimumStock()));
        sparePart.setMaximumStock(defaultDecimal(request.maximumStock()));
        sparePart.setReorderQuantity(defaultDecimal(request.reorderQuantity()));
        sparePart.setLocation(request.location());
        sparePart.setCostCenterId(costCenterId);
        sparePart.setGtin(request.gtin());
        sparePart.setArticleCode(request.articleCode());
        sparePart.setVisibility(defaultVisibility(request.visibility()));
        sparePart.setSupplier(supplier);
        sparePart.setLinkedSpareParts(resolveLinkedSpareParts(request.linkedSparePartIds(), sparePart.getId()));

        syncLinkedEquipment(sparePart, request.linkedEquipmentIds());
        SparePart savedSparePart = sparePartRepository.save(sparePart);

        return toResponse(savedSparePart);
    }

    public void delete(Long id) {
        SparePart sparePart = getSparePart(id);
        fileStorageService.delete(sparePart.getImage(), "spare-parts");
        syncLinkedEquipment(sparePart, List.of());
        sparePartRepository.delete(sparePart);
    }

    private String resolveImage(String requestImage, MultipartFile image, String currentImage) {
        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(currentImage, "spare-parts");
            return fileStorageService.save(image, "spare-parts");
        }

        return requestImage;
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

    private Long resolveCostCenterId(Long costCenterId) {
        if (costCenterId == null || costCenterId <= 0) {
            return null;
        }

        if (!costCenterRepository.existsById(costCenterId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Centre de cout introuvable (id=" + costCenterId + ")."
            );
        }

        return costCenterId;
    }

    private Set<SparePart> resolveLinkedSpareParts(List<Long> linkedSparePartIds, Long currentSparePartId) {
        if (linkedSparePartIds == null || linkedSparePartIds.isEmpty()) {
            return new HashSet<>();
        }

        Set<SparePart> linkedSpareParts = new HashSet<>();

        for (Long linkedSparePartId : linkedSparePartIds) {
            if (linkedSparePartId == null) {
                continue;
            }

            if (currentSparePartId != null && linkedSparePartId.equals(currentSparePartId)) {
                continue;
            }

            linkedSpareParts.add(getSparePart(linkedSparePartId));
        }

        return linkedSpareParts;
    }

    private void syncLinkedEquipment(SparePart sparePart, List<Long> linkedEquipmentIds) {
        Long sparePartId = sparePart.getId();
        List<Equipment> previouslyLinkedEquipment = equipmentRepository.findEquipmentsLinkedToSparePart(sparePartId);

        previouslyLinkedEquipment.forEach(equipment -> equipment.getLinkedSpareParts()
                .removeIf(linkedSparePart -> sparePartId.equals(linkedSparePart.getId())));
        equipmentRepository.saveAll(previouslyLinkedEquipment);

        if (linkedEquipmentIds == null || linkedEquipmentIds.isEmpty()) {
            return;
        }

        List<Equipment> selectedEquipment = linkedEquipmentIds.stream()
                .filter(equipmentId -> equipmentId != null && equipmentId > 0)
                .distinct()
                .map(equipmentId -> equipmentRepository.findById(equipmentId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Equipement introuvable (id=" + equipmentId + ")."
                        )))
                .peek(equipment -> equipment.getLinkedSpareParts().add(sparePart))
                .toList();

        equipmentRepository.saveAll(selectedEquipment);
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

        var linkedEquipments = equipmentRepository.findEquipmentsLinkedToSparePart(sparePart.getId())
                .stream()
                .map(equipment -> new SparePartResponse.LinkedEquipmentResponse(
                        equipment.getId(),
                        equipment.getName(),
                        equipment.getDescription(),
                        equipment.getImage()
                ))
                .toList();

        var linkedSpareParts = sparePart.getLinkedSpareParts()
                .stream()
                .map(linked -> new SparePartResponse.LinkedSparePartResponse(
                        linked.getId(),
                        linked.getName(),
                        linked.getCode(),
                        linked.getImage()
                ))
                .toList();

        var stockMovements = stockMovementRepository.findBySparePartIdOrderByMovementDateDesc(sparePart.getId())
                .stream()
                .map(movement -> new SparePartResponse.StockMovementResponse(
                        movement.getId(),
                        movement.getSource(),
                        movement.getReference(),
                        movement.getMovementType(),
                        movement.getQuantity(),
                        movement.getUnitCost(),
                        movement.getUserName(),
                        movement.getMovementDate()
                ))
                .toList();

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
                linkedEquipments,
                linkedSpareParts,
                stockMovements,
                sparePart.getCreatedAt(),
                sparePart.getUpdatedAt()
        );
    }
}
