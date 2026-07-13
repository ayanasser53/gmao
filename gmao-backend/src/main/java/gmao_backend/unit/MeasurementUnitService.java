package com.gmao.gmao_backend.unit;

import com.gmao.gmao_backend.common.CodeGenerator;
import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.measure.MeasureRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeasurementUnitService {

    private final MeasurementUnitRepository unitRepository;
    private final MeasureRepository measureRepository;
    private final UnitMapper unitMapper;
    private final CodeGenerator codeGenerator;

    @Transactional(readOnly = true)
    public List<UnitResponse> findAll() {
        return unitRepository
                .findAllByOrderByNameAsc()
                .stream()
                .map(unitMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnitResponse findById(Long id) {
        return unitMapper.toResponse(
                findEntityById(id)
        );
    }

    @Transactional
    public UnitResponse create(CreateUnitRequest request) {

        String code = codeGenerator.generateUniqueCode(
                request.code(),
                request.name(),
                unitRepository::existsByCodeIgnoreCase
        );

        MeasurementUnit unit = MeasurementUnit.builder()
                .name(request.name().trim())
                .symbol(request.symbol().trim())
                .code(code)
                .unitType(request.unitType())
                .build();

        return unitMapper.toResponse(
                unitRepository.save(unit)
        );
    }

    @Transactional
    public UnitResponse update(
            Long id,
            UpdateUnitRequest request
    ) {
        MeasurementUnit unit = findEntityById(id);

        String normalizedCode =
                codeGenerator.normalize(request.code());

        if (
                unitRepository.existsByCodeIgnoreCaseAndIdNot(
                        normalizedCode,
                        id
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Une unité possède déjà ce code."
            );
        }

        unit.setName(request.name().trim());
        unit.setSymbol(request.symbol().trim());
        unit.setCode(normalizedCode);
        unit.setUnitType(request.unitType());

        return unitMapper.toResponse(
                unitRepository.save(unit)
        );
    }

    @Transactional
    public void delete(Long id) {
        MeasurementUnit unit = findEntityById(id);

        if (measureRepository.existsByUnitId(id)) {
            throw new ResourceInUseException(
                    "Cette unité est utilisée par une ou plusieurs mesures."
            );
        }

        unitRepository.delete(unit);
    }

    @Transactional(readOnly = true)
    public MeasurementUnit findEntityById(Long id) {
        return unitRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Unité introuvable."
                        )
                );
    }
}