package com.gmao.gmao_backend.sparepart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    boolean existsByCodeAndUsineId(String code, Long usineId);

    Optional<SparePart> findByCodeAndUsineId(String code, Long usineId);

    long countByUsineId(Long usineId);

    // Visibles par une usine : les siennes + le catalogue public partagé.
    List<SparePart> findAllByUsineIdOrVisibility(Long usineId, SparePartVisibility visibility);

    Optional<SparePart> findByIdAndUsineId(Long id, Long usineId);

    List<SparePart> findAllByUsineIdIsNull();
}
