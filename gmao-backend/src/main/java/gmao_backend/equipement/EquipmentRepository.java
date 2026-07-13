package com.gmao.gmao_backend.equipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository
        extends JpaRepository<Equipment, Long> {

    List<Equipment> findAllByOrderByCreatedAtDesc();

    boolean existsByParentEquipmentId(
            Long parentEquipmentId
    );

    boolean existsByCostCenterId(
            Long costCenterId
    );
}