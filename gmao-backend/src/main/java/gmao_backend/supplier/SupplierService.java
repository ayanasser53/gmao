package com.gmao.gmao_backend.supplier;

import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.storage.AppFileStorageService;
import com.gmao.gmao_backend.storage.DatabaseFile;
import com.gmao.gmao_backend.storage.ServedDatabaseFile;
import com.gmao.gmao_backend.usine.UsineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AppFileStorageService fileStorageService;
    private final UsineRepository usineRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public List<SupplierResponse> findAll() {
        Long usineId = currentUserProvider.requireUsineId();

        return supplierRepository.findAllByUsineIdOrVisibility(usineId, SupplierVisibility.PUBLIC)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse findById(Long id) {
        return toResponse(findVisibleSupplierById(id));
    }

    public SupplierResponse create(SupplierRequest request) {
        return create(request, null);
    }

    public SupplierResponse create(SupplierRequest request, MultipartFile logo) {
        Long usineId = currentUserProvider.requireUsineId();

        if (supplierRepository.existsByEmailAndUsineId(request.email(), usineId)) {
            throw new ResourceAlreadyExistsException("Un fournisseur avec cet email existe déjà.");
        }

        Supplier supplier = Supplier.builder()
                .name(request.name())
                .description(request.description())
                .email(request.email())
                .website(request.website())
                .sirenOrSiret(request.sirenOrSiret())
                .reference(request.reference())
                .phone(request.phone())
                .fax(request.fax())
                .address(request.address())
                .postalCode(request.postalCode())
                .city(request.city())
                .country(request.country())
                .visibility(request.visibility() != null ? request.visibility() : SupplierVisibility.PRIVATE)
                .usine(usineRepository.getReferenceById(usineId))
                .build();

        applyLogo(supplier, request.logoUrl(), logo);
        Supplier savedSupplier = supplierRepository.save(supplier);
        updateLogoUrl(savedSupplier);

        return toResponse(savedSupplier);
    }

    public SupplierResponse update(Long id, SupplierRequest request) {
        return update(id, request, null);
    }

    public SupplierResponse update(Long id, SupplierRequest request, MultipartFile logo) {
        Supplier supplier = findOwnedSupplierById(id);

        supplierRepository.findByEmailAndUsineId(request.email(), supplier.getUsine().getId())
                .filter(existingSupplier -> !existingSupplier.getId().equals(id))
                .ifPresent(existingSupplier -> {
                    throw new ResourceAlreadyExistsException("Un fournisseur avec cet email existe déjà.");
                });

        supplier.setName(request.name());
        supplier.setDescription(request.description());
        supplier.setEmail(request.email());
        supplier.setWebsite(request.website());
        supplier.setSirenOrSiret(request.sirenOrSiret());
        supplier.setReference(request.reference());
        supplier.setPhone(request.phone());
        supplier.setFax(request.fax());
        supplier.setAddress(request.address());
        supplier.setPostalCode(request.postalCode());
        supplier.setCity(request.city());
        supplier.setCountry(request.country());
        supplier.setVisibility(request.visibility() != null ? request.visibility() : SupplierVisibility.PRIVATE);
        applyLogo(supplier, request.logoUrl(), logo);
        updateLogoUrl(supplier);

        return toResponse(supplier);
    }

    public void delete(Long id) {
        Supplier supplier = findOwnedSupplierById(id);
        supplierRepository.delete(supplier);
    }

    public ServedDatabaseFile getLogo(Long id) {
        Supplier supplier = findVisibleSupplierById(id);

        if (supplier.getLogoData() == null || supplier.getLogoData().length == 0) {
            throw new ResourceNotFoundException("Logo introuvable.");
        }

        return new ServedDatabaseFile(
                supplier.getLogoName() != null ? supplier.getLogoName() : "supplier-logo",
                supplier.getLogoContentType(),
                supplier.getLogoData()
        );
    }

    private void applyLogo(Supplier supplier, String requestLogoUrl, MultipartFile logo) {
        if (logo != null && !logo.isEmpty()) {
            DatabaseFile databaseFile = fileStorageService.save(logo);
            supplier.setLogoUrl("db-logo");
            supplier.setLogoName(databaseFile.fileName());
            supplier.setLogoContentType(databaseFile.contentType());
            supplier.setLogoSize((long) databaseFile.data().length);
            supplier.setLogoData(databaseFile.data());
            return;
        }

        if (requestLogoUrl == null || requestLogoUrl.isBlank()) {
            supplier.setLogoUrl(null);
            supplier.setLogoName(null);
            supplier.setLogoContentType(null);
            supplier.setLogoSize(null);
            supplier.setLogoData(null);
            return;
        }

        if (supplier.getLogoData() == null) {
            supplier.setLogoUrl(requestLogoUrl);
        }
    }

    private void updateLogoUrl(Supplier supplier) {
        if (supplier.getLogoData() != null && supplier.getId() != null) {
            supplier.setLogoUrl("/api/suppliers/" + supplier.getId() + "/logo");
        }
    }

    /** Lecture : la fiche de sa propre usine, ou une fiche du catalogue public. */
    private Supplier findVisibleSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable."));

        Long usineId = currentUserProvider.requireUsineId();
        boolean own = supplier.getUsine() != null && supplier.getUsine().getId().equals(usineId);
        boolean isPublic = supplier.getVisibility() == SupplierVisibility.PUBLIC;

        if (!own && !isPublic) {
            throw new ResourceNotFoundException("Fournisseur introuvable.");
        }

        return supplier;
    }

    /** Modification/suppression : uniquement la fiche de sa propre usine. */
    private Supplier findOwnedSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable."));

        Long usineId = currentUserProvider.requireUsineId();
        boolean own = supplier.getUsine() != null && supplier.getUsine().getId().equals(usineId);

        if (!own) {
            throw new AccessDeniedException("Vous ne pouvez pas gérer ce fournisseur.");
        }

        return supplier;
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getDescription(),
                supplier.getEmail(),
                supplier.getWebsite(),
                supplier.getSirenOrSiret(),
                supplier.getReference(),
                supplier.getPhone(),
                supplier.getFax(),
                supplier.getAddress(),
                supplier.getPostalCode(),
                supplier.getCity(),
                supplier.getCountry(),
                supplier.getVisibility(),
                supplier.getLogoUrl(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
    }
}
