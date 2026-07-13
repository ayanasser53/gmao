package com.gmao.gmao_backend.unit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeasurementUnitRepository
        extends JpaRepository<MeasurementUnit, Long> {

    List<MeasurementUnit> findAllByOrderByNameAsc();

    Optional<MeasurementUnit> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(
            String code,
            Long id
    );
}