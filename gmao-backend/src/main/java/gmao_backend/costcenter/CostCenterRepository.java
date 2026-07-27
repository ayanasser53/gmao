package com.gmao.gmao_backend.costcenter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CostCenterRepository
        extends JpaRepository<CostCenter, Long> {

    List<CostCenter> findAllByUsineIdOrderByNameAsc(Long usineId);

    Optional<CostCenter> findByIdAndUsineId(Long id, Long usineId);

    boolean existsByNameIgnoreCaseAndUsineId(String name, Long usineId);

    boolean existsByNameIgnoreCaseAndUsineIdAndIdNot(
            String name,
            Long usineId,
            Long id
    );

    List<CostCenter> findAllByUsineIdIsNull();
}
