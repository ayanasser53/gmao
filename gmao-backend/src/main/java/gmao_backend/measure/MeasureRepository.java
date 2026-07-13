package com.gmao.gmao_backend.measure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeasureRepository
        extends JpaRepository<Measure, Long> {

    List<Measure> findAllByOrderByNameAsc();

    Optional<Measure> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(
            String code,
            Long id
    );

    boolean existsByUnitId(Long unitId);
}