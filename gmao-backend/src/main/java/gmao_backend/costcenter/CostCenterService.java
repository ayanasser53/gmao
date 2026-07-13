package com.gmao.gmao_backend.costcenter;

import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.equipment.EquipmentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CostCenterService {

    private final CostCenterRepository costCenterRepository;
    private final EquipmentRepository equipmentRepository;

    @Transactional(readOnly = true)
    public List<CostCenterResponse> findAll() {
        return costCenterRepository
                .findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CostCenterResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Transactional
    public CostCenterResponse create(
            CostCenterRequest request
    ) {
        String name = request.name().trim();

        if (costCenterRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceAlreadyExistsException(
                    "Un centre de coût possède déjà ce nom."
            );
        }

        CostCenter costCenter = CostCenter.builder()
                .name(name)
                .build();

        return toResponse(
                costCenterRepository.save(costCenter)
        );
    }

    @Transactional
    public CostCenterResponse update(
            Long id,
            CostCenterRequest request
    ) {
        CostCenter costCenter = findEntityById(id);

        String name = request.name().trim();

        if (
                costCenterRepository
                        .existsByNameIgnoreCaseAndIdNot(name, id)
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un centre de coût possède déjà ce nom."
            );
        }

        costCenter.setName(name);

        return toResponse(
                costCenterRepository.save(costCenter)
        );
    }

    @Transactional
    public void delete(Long id) {
        CostCenter costCenter = findEntityById(id);

        if (equipmentRepository.existsByCostCenterId(id)) {
            throw new ResourceInUseException(
                    "Ce centre de coût est utilisé par un équipement."
            );
        }

        costCenterRepository.delete(costCenter);
    }

    private CostCenter findEntityById(Long id) {
        return costCenterRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Centre de coût introuvable."
                        )
                );
    }

    private CostCenterResponse toResponse(
            CostCenter costCenter
    ) {
        return new CostCenterResponse(
                costCenter.getId(),
                costCenter.getName()
        );
    }
}