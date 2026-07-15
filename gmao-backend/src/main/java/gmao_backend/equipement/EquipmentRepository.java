package com.gmao.gmao_backend.equipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipmentRepository
        extends JpaRepository<Equipment, Long> {

    List<Equipment> findAllByOrderByCreatedAtDesc();

    boolean existsByCostCenterId(Long costCenterId);

    @Query("select distinct e from Equipment e join e.linkedSpareParts sp where sp.id = :sparePartId")
List<Equipment> findEquipmentsLinkedToSparePart(@Param("sparePartId") Long sparePartId);
}