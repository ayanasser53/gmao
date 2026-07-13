package com.gmao.gmao_backend.measure;

import com.gmao.gmao_backend.common.CodeGenerator;
import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.unit.MeasurementUnit;
import com.gmao.gmao_backend.unit.MeasurementUnitService;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeasureService {

    private final MeasureRepository measureRepository;
    private final MeasurementUnitService unitService;
    private final MeasureMapper measureMapper;
    private final CodeGenerator codeGenerator;

    @Transactional(readOnly = true)
    public List<MeasureResponse> findAll() {
        return measureRepository
                .findAllByOrderByNameAsc()
                .stream()
                .map(measureMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MeasureResponse findById(Long id) {
        return measureMapper.toResponse(
                findEntityById(id)
        );
    }

    @Transactional
    public MeasureResponse create(
            CreateMeasureRequest request
    ) {
        MeasurementUnit unit =
                unitService.findEntityById(request.unitId());

        String code = codeGenerator.generateUniqueCode(
                request.code(),
                request.name(),
                measureRepository::existsByCodeIgnoreCase
        );

        Measure measure = Measure.builder()
                .name(request.name().trim())
                .code(code)
                .description(
                        normalizeOptional(request.description())
                )
                .unit(unit)
                .build();

        return measureMapper.toResponse(
                measureRepository.save(measure)
        );
    }

    @Transactional
    public MeasureResponse update(
            Long id,
            UpdateMeasureRequest request
    ) {
        Measure measure = findEntityById(id);

        String normalizedCode =
                codeGenerator.normalize(request.code());

        if (
                measureRepository.existsByCodeIgnoreCaseAndIdNot(
                        normalizedCode,
                        id
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Une mesure possède déjà ce code."
            );
        }

        MeasurementUnit unit =
                unitService.findEntityById(request.unitId());

        measure.setName(request.name().trim());
        measure.setCode(normalizedCode);
        measure.setDescription(
                normalizeOptional(request.description())
        );
        measure.setUnit(unit);

        return measureMapper.toResponse(
                measureRepository.save(measure)
        );
    }

    @Transactional
    public void delete(Long id) {
        Measure measure = findEntityById(id);

        try {
            measureRepository.delete(measure);
            measureRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResourceInUseException(
                    "Cette mesure est utilisée dans une activité et ne peut pas être supprimée."
            );
        }
    }

    private Measure findEntityById(Long id) {
        return measureRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Mesure introuvable."
                        )
                );
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}