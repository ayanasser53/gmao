package com.gmao.gmao_backend.supplier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByEmailAndUsineId(String email, Long usineId);

    boolean existsByEmailAndUsineId(String email, Long usineId);

    // Fiches visibles par une usine : les siennes + le catalogue public partagé.
    List<Supplier> findAllByUsineIdOrVisibility(Long usineId, SupplierVisibility visibility);

    Optional<Supplier> findByIdAndUsineId(Long id, Long usineId);

    List<Supplier> findAllByUsineIdIsNull();
}
