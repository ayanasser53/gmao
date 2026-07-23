package com.gmao.gmao_backend.sparepart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SparePartStockMovementRepository
        extends JpaRepository<SparePartStockMovement, Long> {

    List<SparePartStockMovement> findBySparePartIdOrderByMovementDateDesc(Long sparePartId);

    @Query("""
            select m from SparePartStockMovement m
            where (:sparePartId is null or m.sparePart.id = :sparePartId)
              and (:startDate is null or m.movementDate >= :startDate)
              and (:endDate is null or m.movementDate <= :endDate)
              and (:taskId is null or m.taskId = :taskId)
              and (:activityId is null or m.activityId = :activityId)
              and (:maintenancePlanId is null or m.maintenancePlanId = :maintenancePlanId)
              and (:userName is null or m.userName = :userName)
            order by m.movementDate desc
            """)
    List<SparePartStockMovement> search(
            @Param("sparePartId") Long sparePartId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("taskId") Long taskId,
            @Param("activityId") Long activityId,
            @Param("maintenancePlanId") Long maintenancePlanId,
            @Param("userName") String userName
    );
}