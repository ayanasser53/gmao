package com.gmao.gmao_backend.sparepart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SparePartStockMovementRepository
        extends JpaRepository<SparePartStockMovement, Long> {

    List<SparePartStockMovement> findBySparePartIdOrderByMovementDateDesc(Long sparePartId);
}