package com.gmao.gmao_backend.equipment;

import com.gmao.gmao_backend.costcenter.CostCenter;
import com.gmao.gmao_backend.costcenter.CostCenterRepository;

import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;

import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;

import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    private final CostCenterRepository costCenterRepository;

    private final TagRepository tagRepository;

    private final SparePartRepository sparePartRepository;

    private final EquipmentMapper mapper;

    private final FileStorageService storage;

    @Transactional(readOnly = true)
    public List<EquipmentResponse> findAll() {
        return equipmentRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EquipmentResponse findById(
            Long id
    ) {
        return mapper.toResponse(
                findEntityById(id)
        );
    }

    @Transactional
    public EquipmentResponse create(
            CreateEquipmentRequest request,
            MultipartFile image
    ) {
        Equipment equipment = Equipment.builder()

                .name(request.name().trim())

                .description(
                        optional(request.description())
                )

                .costCenter(
                        resolveCostCenter(
                                request.costCenterId()
                        )
                )

                .gtinEanCode(
                        optional(request.gtinEanCode())
                )

                .itemCode(
                        optional(request.itemCode())
                )

                .tags(
                        resolveTags(request.tagIds())
                )

                .linkedEquipment(
                        resolveLinkedEquipment(
                                request.linkedEquipmentIds(),
                                null
                        )
                )

                .linkedSpareParts(
                        resolveLinkedSpareParts(
                                request.linkedSparePartIds()
                        )
                )

                .image(storage.save(image))

                .build();

        Equipment savedEquipment =
                equipmentRepository.save(equipment);

        return mapper.toResponse(savedEquipment);
    }

    @Transactional
    public EquipmentResponse update(
            Long id,
            UpdateEquipmentRequest request,
            MultipartFile image
    ) {
        Equipment equipment =
                findEntityById(id);

        equipment.setName(
                request.name().trim()
        );

        equipment.setDescription(
                optional(request.description())
        );

        equipment.setCostCenter(
                resolveCostCenter(
                        request.costCenterId()
                )
        );

        equipment.setGtinEanCode(
                optional(request.gtinEanCode())
        );

        equipment.setItemCode(
                optional(request.itemCode())
        );

        equipment.setTags(
                resolveTags(request.tagIds())
        );

        equipment.setLinkedEquipment(
                resolveLinkedEquipment(
                        request.linkedEquipmentIds(),
                        id
                )
        );

        equipment.setLinkedSpareParts(
                resolveLinkedSpareParts(
                        request.linkedSparePartIds()
                )
        );

        if (request.removeImage()) {
            storage.delete(equipment.getImage());
            equipment.setImage(null);
        }

        if (
                image != null &&
                !image.isEmpty()
        ) {
            storage.delete(equipment.getImage());

            equipment.setImage(
                    storage.save(image)
            );
        }

        Equipment savedEquipment =
                equipmentRepository.save(equipment);

        return mapper.toResponse(savedEquipment);
    }

    @Transactional
    public void delete(
            Long id
    ) {
        Equipment equipment =
                findEntityById(id);

        removeEquipmentFromOtherLinks(
                equipment
        );

        storage.delete(
                equipment.getImage()
        );

        equipmentRepository.delete(
                equipment
        );
    }

    private Equipment findEntityById(
            Long id
    ) {
        return equipmentRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Équipement introuvable."
                                )
                );
    }

    private CostCenter resolveCostCenter(
            Long id
    ) {
        if (id == null) {
            return null;
        }

        return costCenterRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Centre de coût introuvable."
                                )
                );
    }

    private Set<Tag> resolveTags(
            Set<Long> ids
    ) {
        if (
                ids == null ||
                ids.isEmpty()
        ) {
            return new HashSet<>();
        }

        List<Tag> foundTags =
                tagRepository.findAllById(ids);

        if (
                foundTags.size() !=
                        new HashSet<>(ids).size()
        ) {
            throw new ResourceNotFoundException(
                    "Un ou plusieurs tags sont introuvables."
            );
        }

        return new HashSet<>(foundTags);
    }

    private Set<Equipment> resolveLinkedEquipment(
            Set<Long> ids,
            Long currentEquipmentId
    ) {
        if (
                ids == null ||
                ids.isEmpty()
        ) {
            return new HashSet<>();
        }

        Set<Long> uniqueIds =
                new HashSet<>(ids);

        if (
                currentEquipmentId != null &&
                uniqueIds.contains(
                        currentEquipmentId
                )
        ) {
            throw new IllegalArgumentException(
                    "Un équipement ne peut pas être lié à lui-même."
            );
        }

        List<Equipment> foundEquipment =
                equipmentRepository.findAllById(
                        uniqueIds
                );

        if (
                foundEquipment.size() !=
                        uniqueIds.size()
        ) {
            throw new ResourceNotFoundException(
                    "Un ou plusieurs équipements liés sont introuvables."
            );
        }

        return new HashSet<>(
                foundEquipment
        );
    }

    private Set<SparePart> resolveLinkedSpareParts(
            Set<Long> ids
    ) {
        if (
                ids == null ||
                ids.isEmpty()
        ) {
            return new HashSet<>();
        }

        Set<Long> uniqueIds =
                new HashSet<>(ids);

        List<SparePart> foundSpareParts =
                sparePartRepository.findAllById(
                        uniqueIds
                );

        if (
                foundSpareParts.size() !=
                        uniqueIds.size()
        ) {
            throw new ResourceNotFoundException(
                    "Une ou plusieurs pièces de rechange sont introuvables."
            );
        }

        return new HashSet<>(
                foundSpareParts
        );
    }

    private void removeEquipmentFromOtherLinks(
            Equipment equipmentToDelete
    ) {
        List<Equipment> allEquipment =
                equipmentRepository.findAll();

        for (Equipment equipment : allEquipment) {
            if (
                    equipment.getId().equals(
                            equipmentToDelete.getId()
                    )
            ) {
                continue;
            }

            boolean removed =
                    equipment
                            .getLinkedEquipment()
                            .removeIf(
                                    linked ->
                                            linked.getId()
                                                    .equals(
                                                            equipmentToDelete.getId()
                                                    )
                            );

            if (removed) {
                equipmentRepository.save(
                        equipment
                );
            }
        }

        equipmentToDelete
                .getLinkedEquipment()
                .clear();

        equipmentToDelete
                .getLinkedSpareParts()
                .clear();

        equipmentToDelete
                .getTags()
                .clear();
    }

    private String optional(
            String value
    ) {
        return value == null ||
                value.isBlank()
                ? null
                : value.trim();
    }
}