package com.gmao.gmao_backend.suppliercatalog;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.storage.AppFileStorageService;
import com.gmao.gmao_backend.storage.DatabaseFile;
import com.gmao.gmao_backend.storage.ServedDatabaseFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierCatalogService {

    private static final long IMPORTED_SUPPLIER_ID_OFFSET = 100_000L;

    private final SupplierCatalogRepository supplierCatalogRepository;
    private final AppFileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public SupplierCatalogResponse findAll() {
        List<SupplierCatalogItem> catalogItems = supplierCatalogRepository.findAllByOrderByCreatedAtDesc();
        Map<String, SupplierCatalogSupplierResponse> suppliers = new LinkedHashMap<>();

        List<SupplierCatalogItemResponse> items = catalogItems.stream()
                .map(item -> {
                    String supplierKey = supplierKey(item);
                    SupplierCatalogSupplierResponse supplier = suppliers.computeIfAbsent(
                            supplierKey,
                            key -> toSupplierResponse(item, IMPORTED_SUPPLIER_ID_OFFSET + suppliers.size() + 1L)
                    );

                    return toItemResponse(item, supplier.id());
                })
                .toList();

        return new SupplierCatalogResponse(items, List.copyOf(suppliers.values()));
    }

    public SupplierCatalogResponse importItems(SupplierCatalogImportRequest request) {
        Map<String, List<SupplierCatalogItem>> existingItems = new LinkedHashMap<>();

        supplierCatalogRepository.findAll().forEach(item ->
                existingItems
                        .computeIfAbsent(catalogItemKey(item), key -> new ArrayList<>())
                        .add(item)
        );

        List<SupplierCatalogItem> items = new ArrayList<>();

        request.items()
                .stream()
                .filter(item -> item.equipment() != null && !item.equipment().isBlank())
                .map(this::toEntity)
                .forEach(importedItem -> {
                    String key = catalogItemKey(importedItem);
                    List<SupplierCatalogItem> matchingItems =
                            existingItems.computeIfAbsent(key, ignored -> new ArrayList<>());

                    boolean alreadyExists = matchingItems
                            .stream()
                            .anyMatch(existingItem -> hasSameCatalogData(existingItem, importedItem));

                    if (!alreadyExists) {
                        items.add(importedItem);
                        matchingItems.add(importedItem);
                    }
                });

        supplierCatalogRepository.saveAll(items);
        return findAll();
    }

    public void delete(Long id) {
        if (!supplierCatalogRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reference catalogue introuvable.");
        }

        supplierCatalogRepository.deleteById(id);
    }

    public SupplierCatalogItemResponse uploadImage(Long id, MultipartFile image) {
        SupplierCatalogItem item = findItem(id);
        DatabaseFile databaseFile = fileStorageService.save(image);

        if (databaseFile == null) {
            return toItemResponse(item, IMPORTED_SUPPLIER_ID_OFFSET + 1L);
        }

        item.setImage("/api/supplier-catalog/items/" + item.getId() + "/image");
        item.setImageName(databaseFile.fileName());
        item.setImageContentType(databaseFile.contentType());
        item.setImageSize((long) databaseFile.data().length);
        item.setImageData(databaseFile.data());

        SupplierCatalogItem savedItem = supplierCatalogRepository.save(item);
        return toItemResponse(savedItem, IMPORTED_SUPPLIER_ID_OFFSET + 1L);
    }

    @Transactional(readOnly = true)
    public ServedDatabaseFile getImage(Long id) {
        SupplierCatalogItem item = findItem(id);

        if (item.getImageData() == null || item.getImageData().length == 0) {
            throw new ResourceNotFoundException("Image catalogue introuvable.");
        }

        return new ServedDatabaseFile(
                item.getImageName() != null ? item.getImageName() : "catalog-image",
                item.getImageContentType(),
                item.getImageData()
        );
    }

    private SupplierCatalogItem findItem(Long id) {
        return supplierCatalogRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reference catalogue introuvable."));
    }

    private SupplierCatalogItem toEntity(SupplierCatalogRowRequest request) {
        return SupplierCatalogItem.builder()
                .equipmentName(trim(request.equipment()))
                .category(trim(request.category()))
                .brand(trim(request.brand()))
                .manufacturerPartNumber(trim(request.manufacturerReference()))
                .gtinEanCode(trim(request.gtin()))
                .supplierName(defaultSupplierName(request.supplierName()))
                .supplierLogo(defaultLogo(request.supplierLogo(), request.supplierName()))
                .supplierSiren(trim(request.supplierSiren()))
                .supplierPhone(trim(request.supplierPhone()))
                .supplierDescription(trim(request.supplierDescription()))
                .image(trim(request.image()))
                .build();
    }

    private String catalogItemKey(SupplierCatalogItem item) {
        return normalizeKey(item.getSupplierName())
                + "|"
                + normalizeKey(item.getEquipmentName())
                + "|"
                + normalizeKey(item.getManufacturerPartNumber())
                + "|"
                + normalizeKey(item.getGtinEanCode());
    }

    private boolean hasSameCatalogData(SupplierCatalogItem existingItem, SupplierCatalogItem importedItem) {
        return Objects.equals(trim(existingItem.getEquipmentName()), trim(importedItem.getEquipmentName()))
                && Objects.equals(trim(existingItem.getCategory()), trim(importedItem.getCategory()))
                && Objects.equals(trim(existingItem.getBrand()), trim(importedItem.getBrand()))
                && Objects.equals(
                        trim(existingItem.getManufacturerPartNumber()),
                        trim(importedItem.getManufacturerPartNumber())
                )
                && Objects.equals(trim(existingItem.getGtinEanCode()), trim(importedItem.getGtinEanCode()))
                && Objects.equals(trim(existingItem.getSupplierName()), trim(importedItem.getSupplierName()))
                && Objects.equals(trim(existingItem.getSupplierLogo()), trim(importedItem.getSupplierLogo()))
                && Objects.equals(trim(existingItem.getSupplierSiren()), trim(importedItem.getSupplierSiren()))
                && Objects.equals(trim(existingItem.getSupplierPhone()), trim(importedItem.getSupplierPhone()))
                && Objects.equals(
                        trim(existingItem.getSupplierDescription()),
                        trim(importedItem.getSupplierDescription())
                )
                && Objects.equals(trim(existingItem.getImage()), trim(importedItem.getImage()));
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }

    private SupplierCatalogItemResponse toItemResponse(SupplierCatalogItem item, Long supplierId) {
        return new SupplierCatalogItemResponse(
                item.getId(),
                item.getEquipmentName(),
                item.getCategory(),
                item.getBrand(),
                item.getManufacturerPartNumber(),
                item.getGtinEanCode(),
                supplierId,
                item.getImageData() != null ? "/api/supplier-catalog/items/" + item.getId() + "/image" : item.getImage()
        );
    }

    private SupplierCatalogSupplierResponse toSupplierResponse(SupplierCatalogItem item, Long supplierId) {
        return new SupplierCatalogSupplierResponse(
                supplierId,
                item.getSupplierName(),
                item.getSupplierLogo(),
                item.getSupplierSiren(),
                item.getSupplierPhone(),
                item.getSupplierDescription(),
                false
        );
    }

    private String supplierKey(SupplierCatalogItem item) {
        return defaultSupplierName(item.getSupplierName()).trim().toLowerCase();
    }

    private String defaultSupplierName(String supplierName) {
        String value = trim(supplierName);
        return value == null ? "Fournisseur importe" : value;
    }

    private String defaultLogo(String logo, String supplierName) {
        String value = trim(logo);
        if (value != null) {
            return value;
        }

        String name = defaultSupplierName(supplierName);
        String[] parts = name.trim().split("\\s+");
        StringBuilder initials = new StringBuilder();

        for (int index = 0; index < Math.min(2, parts.length); index++) {
            if (!parts[index].isBlank()) {
                initials.append(Character.toUpperCase(parts[index].charAt(0)));
            }
        }

        return initials.isEmpty() ? "FC" : initials.toString();
    }

    private String trim(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
