package com.gmao.gmao_backend.sparepart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    boolean existsByCode(String code);

    Optional<SparePart> findByCode(String code);
}