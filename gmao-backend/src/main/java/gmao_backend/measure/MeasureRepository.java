package com.gmao.gmao_backend.measure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeasureRepository
        extends JpaRepository<Measure, Long> {

    List<Measure> findAllByUsineIdOrderByNameAsc(Long usineId);

    Optional<Measure> findByIdAndUsineId(Long id, Long usineId);

    boolean existsByCodeIgnoreCaseAndUsineId(String code, Long usineId);

    boolean existsByCodeIgnoreCaseAndUsineIdAndIdNot(
            String code,
            Long usineId,
            Long id
    );

    boolean existsByUnitId(Long unitId);

    List<Measure> findAllByUsineIdIsNull();
}
