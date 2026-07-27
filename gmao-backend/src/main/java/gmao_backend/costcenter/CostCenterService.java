package com.gmao.gmao_backend.costcenter;

import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.usine.Usine;
import com.gmao.gmao_backend.usine.UsineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CostCenterService {

    private final CostCenterRepository costCenterRepository;
    private final EquipmentRepository equipmentRepository;
    private final UsineRepository usineRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public List<CostCenterResponse> findAll() {
        return costCenterRepository
                .findAllByUsineIdOrderByNameAsc(currentUserProvider.requireUsineId())
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
        Long usineId = currentUserProvider.requireUsineId();
        String name = request.name().trim();

        if (costCenterRepository.existsByNameIgnoreCaseAndUsineId(name, usineId)) {
            throw new ResourceAlreadyExistsException(
                    "Un centre de coût possède déjà ce nom."
            );
        }

        CostCenter costCenter = CostCenter.builder()
                .name(name)
                .usine(usineRepository.getReferenceById(usineId))
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
                        .existsByNameIgnoreCaseAndUsineIdAndIdNot(
                                name, currentUserProvider.requireUsineId(), id
                        )
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
                .findByIdAndUsineId(id, currentUserProvider.requireUsineId())
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
