package com.gmao.gmao_backend.equipment;

import com.gmao.gmao_backend.costcenter.CostCenter;
import com.gmao.gmao_backend.costcenter.CostCenterRepository;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EquipmentService {
    private final EquipmentRepository equipmentRepository;
    private final CostCenterRepository costCenterRepository;
    private final TagRepository tagRepository;
    private final EquipmentMapper mapper;
    private final FileStorageService storage;

    @Transactional(readOnly = true)
    public List<EquipmentResponse> findAll() {
        return equipmentRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EquipmentResponse findById(Long id) {
        return mapper.toResponse(entity(id));
    }

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest r, MultipartFile image) {
        Equipment e = Equipment.builder()
            .name(r.name().trim())
            .description(optional(r.description()))
            .costCenter(costCenter(r.costCenterId()))
            .gtinEanCode(optional(r.gtinEanCode()))
            .itemCode(optional(r.itemCode()))
            .parentEquipment(parent(r.parentEquipmentId(), null))
            .visibility(r.visibility() == null ? EquipmentVisibility.PRIVATE : r.visibility())
            .tags(tags(r.tagIds()))
            .image(storage.save(image))
            .build();
        return mapper.toResponse(equipmentRepository.save(e));
    }

    @Transactional
    public EquipmentResponse update(Long id, UpdateEquipmentRequest r, MultipartFile image) {
        Equipment e = entity(id);
        e.setName(r.name().trim());
        e.setDescription(optional(r.description()));
        e.setCostCenter(costCenter(r.costCenterId()));
        e.setGtinEanCode(optional(r.gtinEanCode()));
        e.setItemCode(optional(r.itemCode()));
        e.setParentEquipment(parent(r.parentEquipmentId(), id));
        e.setVisibility(r.visibility() == null ? EquipmentVisibility.PRIVATE : r.visibility());
        e.setTags(tags(r.tagIds()));

        if (r.removeImage()) {
            storage.delete(e.getImage());
            e.setImage(null);
        }
        if (image != null && !image.isEmpty()) {
            storage.delete(e.getImage());
            e.setImage(storage.save(image));
        }
        return mapper.toResponse(equipmentRepository.save(e));
    }

    @Transactional
    public void delete(Long id) {
        Equipment e = entity(id);
        if (equipmentRepository.existsByParentEquipmentId(id))
            throw new ResourceInUseException("Cet équipement est lié à un autre équipement.");
        storage.delete(e.getImage());
        equipmentRepository.delete(e);
    }

    private Equipment entity(Long id) {
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Équipement introuvable."));
    }

    private CostCenter costCenter(Long id) {
        if (id == null) return null;
        return costCenterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Centre de coût introuvable."));
    }

    private Equipment parent(Long id, Long currentId) {
        if (id == null) return null;
        if (currentId != null && currentId.equals(id))
            throw new IllegalArgumentException("Un équipement ne peut pas être lié à lui-même.");
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Équipement lié introuvable."));
    }

    private Set<Tag> tags(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Tag> result = tagRepository.findAllById(ids);
        if (result.size() != ids.size())
            throw new ResourceNotFoundException("Un ou plusieurs tags sont introuvables.");
        return new HashSet<>(result);
    }

    private String optional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
